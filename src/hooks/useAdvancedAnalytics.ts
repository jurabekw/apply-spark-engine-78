import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface RecruitmentPerformance {
  month: string;
  source: string;
  total_candidates: number;
  shortlisted: number;
  hired: number;
  avg_ai_score: number;
  batches_processed: number;
}

interface SkillAnalysis {
  skill: string;
  frequency: number;
  avg_score: number;
  source: string;
}

interface SearchPattern {
  job_title: string;
  experience_level: string;
  search_count: number;
  avg_candidates_found: number;
  week: string;
}

interface AnalyticsData {
  performanceMetrics: RecruitmentPerformance[];
  skillsData: SkillAnalysis[];
  searchPatterns: SearchPattern[];
  summary: {
    totalCandidates: number;
    avgAiScore: number;
    topSkills: string[];
    mostSearchedRoles: string[];
    conversionRate: number;
  };
}

export const useAdvancedAnalytics = (dateRange?: { from: Date; to: Date }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Refresh materialized views for latest data
      await supabase.rpc('refresh_analytics_views');

      // Fetch recruitment performance data
      const { data: performanceData, error: perfError } = await supabase
        .from('recruitment_performance')
        .select('*')
        .eq('user_id', user.id)
        .order('month', { ascending: false });

      if (perfError) throw perfError;

      // Fetch skills analysis
      const { data: skillsData, error: skillsError } = await supabase
        .from('skills_analysis')
        .select('*')
        .eq('user_id', user.id)
        .order('frequency', { ascending: false })
        .limit(20);

      if (skillsError) throw skillsError;

      // Fetch search patterns
      const { data: patternsData, error: patternsError } = await supabase
        .from('search_patterns')
        .select('*')
        .eq('user_id', user.id)
        .order('week', { ascending: false })
        .limit(50);

      if (patternsError) throw patternsError;

      // Calculate summary metrics
      const totalCandidates = performanceData?.reduce((sum, item) => sum + item.total_candidates, 0) || 0;
      const totalShortlisted = performanceData?.reduce((sum, item) => sum + item.shortlisted, 0) || 0;
      const avgScore = performanceData?.length 
        ? performanceData.reduce((sum, item) => sum + (item.avg_ai_score || 0), 0) / performanceData.length 
        : 0;
      
      const topSkills = skillsData?.slice(0, 5).map(skill => skill.skill) || [];
      const mostSearchedRoles = patternsData?.slice(0, 5).map(pattern => pattern.job_title) || [];
      const conversionRate = totalCandidates > 0 ? (totalShortlisted / totalCandidates) * 100 : 0;

      setData({
        performanceMetrics: performanceData || [],
        skillsData: skillsData || [],
        searchPatterns: patternsData || [],
        summary: {
          totalCandidates,
          avgAiScore: avgScore,
          topSkills,
          mostSearchedRoles,
          conversionRate,
        },
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error loading analytics",
        description: "Failed to fetch analytics data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user, dateRange]);

  return {
    data,
    loading,
    refetch: fetchAnalytics,
  };
};