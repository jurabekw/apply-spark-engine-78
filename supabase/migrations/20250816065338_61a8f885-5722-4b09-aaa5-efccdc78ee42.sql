-- Fix function search path issue by setting search_path
CREATE OR REPLACE FUNCTION public.refresh_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.recruitment_performance;
  REFRESH MATERIALIZED VIEW public.skills_analysis;
  REFRESH MATERIALIZED VIEW public.search_patterns;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Remove materialized views from API by excluding them from the default schema
REVOKE ALL ON public.recruitment_performance FROM anon, authenticated;
REVOKE ALL ON public.skills_analysis FROM anon, authenticated;
REVOKE ALL ON public.search_patterns FROM anon, authenticated;