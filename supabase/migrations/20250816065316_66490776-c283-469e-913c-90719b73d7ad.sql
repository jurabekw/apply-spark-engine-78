-- Create analytics tables for aggregated metrics
CREATE TABLE public.analytics_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  metric_type TEXT NOT NULL, -- 'daily_stats', 'source_performance', 'skill_trends', etc.
  metric_data JSONB NOT NULL,
  date_period DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create materialized view for recruitment performance
CREATE MATERIALIZED VIEW public.recruitment_performance AS
SELECT 
  user_id,
  DATE_TRUNC('month', created_at) as month,
  source,
  COUNT(*) as total_candidates,
  COUNT(CASE WHEN status = 'shortlisted' THEN 1 END) as shortlisted,
  COUNT(CASE WHEN status = 'hired' THEN 1 END) as hired,
  AVG(ai_score) as avg_ai_score,
  COUNT(DISTINCT batch_id) as batches_processed
FROM public.candidates 
GROUP BY user_id, DATE_TRUNC('month', created_at), source;

-- Create materialized view for skills analysis
CREATE MATERIALIZED VIEW public.skills_analysis AS
SELECT 
  user_id,
  unnest(skills) as skill,
  COUNT(*) as frequency,
  AVG(ai_score) as avg_score,
  source
FROM public.candidates 
WHERE skills IS NOT NULL
GROUP BY user_id, unnest(skills), source;

-- Create materialized view for search patterns
CREATE MATERIALIZED VIEW public.search_patterns AS
SELECT 
  user_id,
  job_title,
  experience_level,
  COUNT(*) as search_count,
  AVG(candidate_count) as avg_candidates_found,
  DATE_TRUNC('week', created_at) as week
FROM (
  SELECT user_id, job_title, experience_level, candidate_count, created_at FROM public.hh_searches
  UNION ALL
  SELECT user_id, job_title, experience_level, candidate_count, created_at FROM public.linkedin_searches
) searches
GROUP BY user_id, job_title, experience_level, DATE_TRUNC('week', created_at);

-- Enable RLS on analytics_metrics
ALTER TABLE public.analytics_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for analytics_metrics
CREATE POLICY "Users can view their own analytics" 
ON public.analytics_metrics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics" 
ON public.analytics_metrics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics" 
ON public.analytics_metrics 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to refresh materialized views
CREATE OR REPLACE FUNCTION public.refresh_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.recruitment_performance;
  REFRESH MATERIALIZED VIEW public.skills_analysis;
  REFRESH MATERIALIZED VIEW public.search_patterns;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_analytics_metrics_updated_at
BEFORE UPDATE ON public.analytics_metrics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();