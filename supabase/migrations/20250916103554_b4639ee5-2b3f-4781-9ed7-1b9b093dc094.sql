-- Create the increment_trial_usage function to safely track usage
CREATE OR REPLACE FUNCTION increment_trial_usage(
  p_user_id UUID,
  p_module_type TEXT,
  p_metadata JSONB DEFAULT '{}'::JSONB
) RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  analyses_used INTEGER,
  analyses_remaining INTEGER
) AS $$
DECLARE
  v_trial_id UUID;
  v_current_usage INTEGER;
  v_usage_limit INTEGER;
  v_is_active BOOLEAN;
  v_trial_ends_at TIMESTAMP WITH TIME ZONE;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- Get current trial information
  SELECT 
    id, 
    analyses_used, 
    analyses_limit, 
    is_active, 
    trial_ends_at
  INTO 
    v_trial_id, 
    v_current_usage, 
    v_usage_limit, 
    v_is_active, 
    v_trial_ends_at
  FROM user_trials 
  WHERE user_id = p_user_id;

  -- Check if trial exists
  IF v_trial_id IS NULL THEN
    RETURN QUERY SELECT false, 'Trial not found', 0, 0;
    RETURN;
  END IF;

  -- Check if trial is still active (time-wise)
  IF v_now >= v_trial_ends_at THEN
    RETURN QUERY SELECT false, 'Trial has expired (time limit)', v_current_usage, (v_usage_limit - v_current_usage);
    RETURN;
  END IF;

  -- Check if trial is active
  IF NOT v_is_active THEN
    RETURN QUERY SELECT false, 'Trial is not active', v_current_usage, (v_usage_limit - v_current_usage);
    RETURN;
  END IF;

  -- Check if usage limit has been reached
  IF v_current_usage >= v_usage_limit THEN
    RETURN QUERY SELECT false, 'Usage limit reached', v_current_usage, (v_usage_limit - v_current_usage);
    RETURN;
  END IF;

  -- Increment usage atomically
  UPDATE user_trials 
  SET 
    analyses_used = analyses_used + 1,
    updated_at = v_now
  WHERE id = v_trial_id;

  -- Log the usage
  INSERT INTO trial_usage_log (
    user_id, 
    trial_id, 
    module_type, 
    action_type, 
    metadata
  ) VALUES (
    p_user_id, 
    v_trial_id, 
    p_module_type, 
    'analysis', 
    p_metadata
  );

  -- Return success with updated counts
  RETURN QUERY SELECT 
    true, 
    'Usage recorded successfully', 
    (v_current_usage + 1), 
    (v_usage_limit - v_current_usage - 1);

EXCEPTION WHEN OTHERS THEN
  -- Handle any errors
  RETURN QUERY SELECT false, 'Error recording usage: ' || SQLERRM, v_current_usage, (v_usage_limit - v_current_usage);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;