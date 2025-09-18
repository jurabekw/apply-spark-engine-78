-- Replace increment_trial_usage to ensure atomic credit deduction and correct returns
CREATE OR REPLACE FUNCTION public.increment_trial_usage(
  p_user_id uuid,
  p_module_type text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(success boolean, message text, analyses_used integer, analyses_remaining integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_trial RECORD;
  v_now timestamptz := now();
  v_new_used integer;
BEGIN
  -- Lock the user's trial row to prevent race conditions
  SELECT id, analyses_used, analyses_limit, is_active, trial_ends_at
  INTO v_trial
  FROM user_trials
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Trial not found', 0, 0;
    RETURN;
  END IF;

  -- Check time expiration
  IF v_now >= v_trial.trial_ends_at THEN
    RETURN QUERY SELECT false, 'Trial has expired (time limit)', v_trial.analyses_used, (v_trial.analyses_limit - v_trial.analyses_used);
    RETURN;
  END IF;

  -- Check active flag
  IF NOT v_trial.is_active THEN
    RETURN QUERY SELECT false, 'Trial is not active', v_trial.analyses_used, (v_trial.analyses_limit - v_trial.analyses_used);
    RETURN;
  END IF;

  -- Check usage limit
  IF v_trial.analyses_used >= v_trial.analyses_limit THEN
    RETURN QUERY SELECT false, 'Usage limit reached', v_trial.analyses_used, (v_trial.analyses_limit - v_trial.analyses_used);
    RETURN;
  END IF;

  -- Increment usage and return new value
  UPDATE user_trials
  SET analyses_used = analyses_used + 1,
      updated_at = v_now
  WHERE id = v_trial.id
  RETURNING analyses_used INTO v_new_used;

  -- Log usage
  INSERT INTO trial_usage_log (
    user_id, trial_id, module_type, action_type, metadata
  ) VALUES (
    p_user_id, v_trial.id, p_module_type, 'analysis', COALESCE(p_metadata, '{}'::jsonb)
  );

  -- Success
  RETURN QUERY SELECT true, 'Usage recorded successfully', v_new_used, (v_trial.analyses_limit - v_new_used);

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, 'Error recording usage: ' || SQLERRM, v_trial.analyses_used, (v_trial.analyses_limit - v_trial.analyses_used);
END;
$function$;

-- Ensure authenticated users can execute the function
GRANT EXECUTE ON FUNCTION public.increment_trial_usage(uuid, text, jsonb) TO authenticated;