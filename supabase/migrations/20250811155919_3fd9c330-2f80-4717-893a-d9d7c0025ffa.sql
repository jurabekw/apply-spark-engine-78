-- Create table to store HH candidate search history
CREATE TABLE IF NOT EXISTS public.hh_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_title TEXT NOT NULL,
  required_skills TEXT NOT NULL,
  experience_level TEXT NOT NULL,
  response JSONB NOT NULL,
  candidate_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.hh_searches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own HH searches"
ON public.hh_searches
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own HH searches"
ON public.hh_searches
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own HH searches"
ON public.hh_searches
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own HH searches"
ON public.hh_searches
FOR DELETE
USING (auth.uid() = user_id);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_hh_searches_user_created ON public.hh_searches (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hh_searches_created ON public.hh_searches (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hh_searches_candidate_count ON public.hh_searches (candidate_count);
