-- Create user_trials table for managing free trial system
CREATE TABLE public.user_trials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  trial_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  trial_ends_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '72 hours'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_trials ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_trials
CREATE POLICY "Users can view their own trial" 
ON public.user_trials 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trial" 
ON public.user_trials 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trial" 
ON public.user_trials 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_trials_updated_at
BEFORE UPDATE ON public.user_trials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create trial on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_trial()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_trials (user_id, trial_started_at, trial_ends_at, is_active)
  VALUES (
    NEW.id, 
    now(), 
    now() + INTERVAL '72 hours',
    true
  );
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create trial when user signs up
CREATE TRIGGER on_auth_user_trial_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_trial();

-- Create index for better performance
CREATE INDEX idx_user_trials_user_id ON public.user_trials(user_id);
CREATE INDEX idx_user_trials_ends_at ON public.user_trials(trial_ends_at);