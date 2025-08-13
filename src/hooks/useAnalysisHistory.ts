import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AnalysisHistory {
  id: string;
  name: string;
  original_filename: string;
  position: string;
  status: string;
  ai_score: number;
  ai_analysis: any;
  created_at: string;
  source: string;
}

export const useAnalysisHistory = (page: number = 1, pageSize: number = 10) => {
  const [analyses, setAnalyses] = useState<AnalysisHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAnalysisHistory = async () => {
    if (!user) return;
    
    try {
      // Get total count
      const { count, error: countError } = await supabase
        .from('candidates')
        .select('*', { count: 'exact', head: true })
        .eq('source', 'upload');

      if (countError) throw countError;
      setTotalCount(count || 0);

      // Get paginated data
      const { data, error } = await supabase
        .from('candidates')
        .select('id, name, original_filename, position, status, ai_score, ai_analysis, created_at, source')
        .eq('source', 'upload')
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error) {
      console.error('Error fetching analysis history:', error);
      toast({
        title: "Error loading analysis history",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAnalysis = async (analysisId: string) => {
    try {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', analysisId);

      if (error) throw error;
      
      setAnalyses(prev => prev.filter(analysis => analysis.id !== analysisId));
      setTotalCount(prev => prev - 1);

      toast({
        title: "Analysis deleted",
        description: "Analysis history entry has been removed.",
      });
    } catch (error) {
      console.error('Error deleting analysis:', error);
      toast({
        title: "Error deleting analysis",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAnalysisHistory();
  }, [user, page]);

  return {
    analyses,
    loading,
    totalCount,
    deleteAnalysis,
    refetch: fetchAnalysisHistory,
  };
};