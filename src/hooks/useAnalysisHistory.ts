import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

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

export const useAnalysisHistory = () => {
  const [analyses, setAnalyses] = useState<AnalysisHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const fetchAnalysisHistory = async () => {
    if (!user) return;
    
    try {
      // Get all data without pagination
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('source', 'upload')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setAnalyses(data || []);
      setTotalCount(data?.length || 0);
    } catch (error) {
      console.error('Error fetching analysis history:', error);
      toast({
        title: t('hooks.analysisHistory.errorLoadingHistory'),
        description: t('hooks.analysisHistory.tryAgainLater'),
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
        title: t('hooks.analysisHistory.analysisDeleted'),
        description: t('hooks.analysisHistory.analysisRemoved'),
      });
    } catch (error) {
      console.error('Error deleting analysis:', error);
      toast({
        title: t('hooks.analysisHistory.errorDeletingAnalysis'),
        description: t('hooks.analysisHistory.tryAgain'),
        variant: "destructive",
      });
    }
  };

  const deleteAllAnalyses = async () => {
    try {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('source', 'upload')
        .eq('user_id', user?.id);

      if (error) throw error;
      
      setAnalyses([]);
      setTotalCount(0);

      // Trigger a window event to notify dashboard to refresh stats
      window.dispatchEvent(new CustomEvent('candidates-deleted'));

      toast({
        title: t('hooks.analysisHistory.allAnalysesDeleted'),
        description: t('hooks.analysisHistory.historyCleared'),
      });
    } catch (error) {
      console.error('Error deleting all analyses:', error);
      toast({
        title: t('hooks.analysisHistory.errorDeletingAnalyses'),
        description: t('hooks.analysisHistory.tryAgain'),
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAnalysisHistory();
  }, [user]);

  return {
    analyses,
    loading,
    totalCount,
    deleteAnalysis,
    deleteAllAnalyses,
    refetch: fetchAnalysisHistory,
  };
};