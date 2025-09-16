-- Ensure authenticated users can call the trial usage RPC
GRANT EXECUTE ON FUNCTION public.increment_trial_usage(uuid, text, jsonb) TO authenticated;