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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const fetchAnalysisHistory = async (page: number = 1) => {
    if (!user) return;
    
    try {
      const offset = (page - 1) * itemsPerPage;
      
      // Get total count
      const { count } = await supabase
        .from('candidates')
        .select('*', { count: 'exact', head: true })
        .eq('source', 'upload');
      
      // Get paginated data
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('source', 'upload')
        .order('created_at', { ascending: false })
        .range(offset, offset + itemsPerPage - 1);

      if (error) throw error;
      setAnalyses(data || []);
      setTotalCount(count || 0);
      setCurrentPage(page);
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
      
      // Refetch current page after deletion
      await fetchAnalysisHistory(currentPage);

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
      setCurrentPage(1);

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

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  useEffect(() => {
    fetchAnalysisHistory(1);
  }, [user]);

  return {
    analyses,
    loading,
    totalCount,
    currentPage,
    totalPages,
    deleteAnalysis,
    deleteAllAnalyses,
    refetch: fetchAnalysisHistory,
    goToPage: (page: number) => fetchAnalysisHistory(page),
  };
};