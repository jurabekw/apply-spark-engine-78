-- Step 1: Add unique constraint on user_trials.user_id to prevent duplicate trials
ALTER TABLE public.user_trials ADD CONSTRAINT user_trials_user_id_unique UNIQUE (user_id);

-- Step 2: Add idempotency_key to trial_usage_log for preventing duplicate operations
ALTER TABLE public.trial_usage_log ADD COLUMN idempotency_key TEXT;
CREATE INDEX idx_trial_usage_log_idempotency ON public.trial_usage_log (idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Step 3: Add updated_at trigger to user_trials if not exists
DROP TRIGGER IF EXISTS update_user_trials_updated_at ON public.user_trials;
CREATE TRIGGER update_user_trials_updated_at
  BEFORE UPDATE ON public.user_trials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Step 4: Enhanced increment_trial_usage function with better atomicity and idempotency
CREATE OR REPLACE FUNCTION public.increment_trial_usage(
  p_user_id uuid, 
  p_module_type text, 
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_idempotency_key text DEFAULT NULL
) 
RETURNS TABLE(
  success boolean, 
  message text, 
  analyses_used integer, 
  analyses_remaining integer,
  trial_id uuid
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  v_trial RECORD;
  v_now timestamptz := now();
  v_new_used integer;
  v_existing_log_id uuid;
BEGIN
  -- Check for existing operation with same idempotency key
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing_log_id
    FROM trial_usage_log 
    WHERE idempotency_key = p_idempotency_key 
    AND user_id = p_user_id
    LIMIT 1;
    
    IF FOUND THEN
      -- Get current trial state for existing operation
      SELECT ut.id, ut.analyses_used, ut.analyses_limit, ut.is_active, ut.trial_ends_at
      INTO v_trial
      FROM user_trials ut
      WHERE ut.user_id = p_user_id;
      
      RETURN QUERY SELECT 
        true, 
        'Operation already processed (idempotent)', 
        v_trial.analyses_used, 
        (v_trial.analyses_limit - v_trial.analyses_used),
        v_trial.id;
      RETURN;
    END IF;
  END IF;

  -- Lock the user's trial row to prevent race conditions
  SELECT id, analyses_used, analyses_limit, is_active, trial_ends_at
  INTO v_trial
  FROM user_trials
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Auto-create trial if missing (fallback safety)
    INSERT INTO user_trials (user_id, trial_started_at, trial_ends_at, is_active, analyses_used, analyses_limit)
    VALUES (p_user_id, v_now, v_now + INTERVAL '72 hours', true, 0, 20)
    RETURNING id, analyses_used, analyses_limit, is_active, trial_ends_at INTO v_trial;
  END IF;

  -- Validation checks
  IF v_now >= v_trial.trial_ends_at THEN
    RETURN QUERY SELECT 
      false, 
      'Trial has expired (time limit)', 
      v_trial.analyses_used, 
      (v_trial.analyses_limit - v_trial.analyses_used),
      v_trial.id;
    RETURN;
  END IF;

  IF NOT v_trial.is_active THEN
    RETURN QUERY SELECT 
      false, 
      'Trial is not active', 
      v_trial.analyses_used, 
      (v_trial.analyses_limit - v_trial.analyses_used),
      v_trial.id;
    RETURN;
  END IF;

  IF v_trial.analyses_used >= v_trial.analyses_limit THEN
    RETURN QUERY SELECT 
      false, 
      'Usage limit reached', 
      v_trial.analyses_used, 
      (v_trial.analyses_limit - v_trial.analyses_used),
      v_trial.id;
    RETURN;
  END IF;

  -- Atomic increment and logging in same transaction
  UPDATE user_trials
  SET analyses_used = analyses_used + 1,
      updated_at = v_now
  WHERE id = v_trial.id
  RETURNING analyses_used INTO v_new_used;

  -- Log usage with idempotency key
  INSERT INTO trial_usage_log (
    user_id, trial_id, module_type, action_type, metadata, idempotency_key
  ) VALUES (
    p_user_id, v_trial.id, p_module_type, 'analysis', 
    COALESCE(p_metadata, '{}'::jsonb), p_idempotency_key
  );

  -- Success
  RETURN QUERY SELECT 
    true, 
    'Usage recorded successfully', 
    v_new_used, 
    (v_trial.analyses_limit - v_new_used),
    v_trial.id;

EXCEPTION 
  WHEN unique_violation THEN
    -- Handle potential race condition on idempotency key
    IF p_idempotency_key IS NOT NULL THEN
      -- Get current state and return as if operation succeeded
      SELECT ut.id, ut.analyses_used, ut.analyses_limit
      INTO v_trial
      FROM user_trials ut
      WHERE ut.user_id = p_user_id;
      
      RETURN QUERY SELECT 
        true, 
        'Operation already processed (race condition)', 
        v_trial.analyses_used, 
        (v_trial.analyses_limit - v_trial.analyses_used),
        v_trial.id;
    ELSE
      RETURN QUERY SELECT 
        false, 
        'Concurrent operation detected', 
        0, 0, NULL::uuid;
    END IF;
  WHEN OTHERS THEN
    RETURN QUERY SELECT 
      false, 
      'Error recording usage: ' || SQLERRM, 
      COALESCE(v_trial.analyses_used, 0), 
      COALESCE((v_trial.analyses_limit - v_trial.analyses_used), 0),
      v_trial.id;
END;
$$;