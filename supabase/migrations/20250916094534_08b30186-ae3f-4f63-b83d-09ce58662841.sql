-- Add usage tracking columns to user_trials table
ALTER TABLE public.user_trials 
ADD COLUMN analyses_used integer NOT NULL DEFAULT 0,
ADD COLUMN analyses_limit integer NOT NULL DEFAULT 20;

-- Create trial usage log table for detailed tracking
CREATE TABLE public.trial_usage_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  trial_id uuid NOT NULL,
  module_type text NOT NULL CHECK (module_type IN ('resume_upload', 'hh_search', 'linkedin_search')),
  action_type text NOT NULL DEFAULT 'analysis',
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on trial_usage_log
ALTER TABLE public.trial_usage_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for trial_usage_log
CREATE POLICY "Users can view their own trial usage logs" 
ON public.trial_usage_log 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trial usage logs" 
ON public.trial_usage_log 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Update the trial creation trigger to set initial usage limits
CREATE OR REPLACE FUNCTION public.handle_new_user_trial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.user_trials (user_id, trial_started_at, trial_ends_at, is_active, analyses_used, analyses_limit)
  VALUES (
    NEW.id, 
    now(), 
    now() + INTERVAL '72 hours',
    true,
    0,
    20
  );
  RETURN NEW;
END;
$function$;

-- Create function to increment trial usage atomically
CREATE OR REPLACE FUNCTION public.increment_trial_usage(
  p_user_id uuid,
  p_module_type text,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_trial_id uuid;
  v_current_usage integer;
  v_usage_limit integer;
  v_trial_active boolean;
  v_trial_expired boolean;
  v_result jsonb;
BEGIN
  -- Get current trial information
  SELECT id, analyses_used, analyses_limit, is_active, (trial_ends_at < now()) as expired
  INTO v_trial_id, v_current_usage, v_usage_limit, v_trial_active, v_trial_expired
  FROM public.user_trials
  WHERE user_id = p_user_id
  AND is_active = true
  FOR UPDATE;

  -- Check if trial exists
  IF v_trial_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'no_active_trial',
      'message', 'No active trial found'
    );
  END IF;

  -- Check if trial is expired by time
  IF v_trial_expired THEN
    -- Deactivate the trial
    UPDATE public.user_trials 
    SET is_active = false, updated_at = now()
    WHERE id = v_trial_id;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'trial_expired',
      'message', 'Trial has expired'
    );
  END IF;

  -- Check if usage limit would be exceeded
  IF v_current_usage >= v_usage_limit THEN
    -- Deactivate the trial due to usage limit
    UPDATE public.user_trials 
    SET is_active = false, updated_at = now()
    WHERE id = v_trial_id;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'usage_limit_exceeded',
      'message', 'Trial usage limit exceeded'
    );
  END IF;

  -- Increment usage count
  UPDATE public.user_trials 
  SET analyses_used = analyses_used + 1, updated_at = now()
  WHERE id = v_trial_id;

  -- Log the usage
  INSERT INTO public.trial_usage_log (user_id, trial_id, module_type, action_type, metadata)
  VALUES (p_user_id, v_trial_id, p_module_type, 'analysis', p_metadata);

  -- Check if this increment reaches the limit
  v_current_usage := v_current_usage + 1;
  IF v_current_usage >= v_usage_limit THEN
    -- Deactivate the trial
    UPDATE public.user_trials 
    SET is_active = false, updated_at = now()
    WHERE id = v_trial_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'analyses_used', v_current_usage,
    'analyses_limit', v_usage_limit,
    'remaining', v_usage_limit - v_current_usage,
    'trial_active', CASE WHEN v_current_usage >= v_usage_limit THEN false ELSE true END
  );
END;
$function$;

-- Create rate limiting table for anti-abuse
CREATE TABLE public.rate_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  action_type text NOT NULL,
  count integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, action_type, window_start)
);

-- Enable RLS on rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for rate_limits
CREATE POLICY "Users can view their own rate limits" 
ON public.rate_limits 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage rate limits" 
ON public.rate_limits 
FOR ALL 
USING (true);

-- Add constraint to prevent trial abuse (one trial per user)
ALTER TABLE public.user_trials 
ADD CONSTRAINT unique_user_trial UNIQUE(user_id);