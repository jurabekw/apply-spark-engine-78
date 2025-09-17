import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface BatchHistory {
  id: string;
  job_title: string;
  job_requirements: string;
  total_candidates: number;
  created_at: string;
  candidates?: any[];
}

export const useBatchHistory = () => {
  const [batches, setBatches] = useState<BatchHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const fetchBatchHistory = async (page: number = 1, silent = false) => {
    if (!user) return;
    
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const offset = (page - 1) * itemsPerPage;

      // Get total count
      const { count } = await supabase
        .from('candidate_batches')
        .select('*', { count: 'exact', head: true });

      // Get paginated batches
      const { data: batchData, error: batchError } = await supabase
        .from('candidate_batches')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + itemsPerPage - 1);

      if (batchError) throw batchError;

      // Get candidates for each batch
      const batchesWithCandidates = await Promise.all(
        (batchData || []).map(async (batch) => {
          const { data: candidates, error: candidatesError } = await supabase
            .from('candidates')
            .select('*')
            .eq('batch_id', batch.id);

          if (candidatesError) {
            console.error('Error fetching candidates for batch:', batch.id, candidatesError);
            return { ...batch, candidates: [] };
          }

          return { ...batch, candidates: candidates || [] };
        })
      );

      setBatches(batchesWithCandidates);
      setTotalCount(count || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching batch history:', error);
      toast({
        title: t('hooks.batchHistory.errorLoadingBatchHistory'),
        description: t('hooks.batchHistory.tryAgainLater'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const deleteBatch = async (batchId: string) => {
    try {
      // Delete all candidates in this batch first
      const { error: candidatesError } = await supabase
        .from('candidates')
        .delete()
        .eq('batch_id', batchId);

      if (candidatesError) throw candidatesError;

      // Delete the batch record
      const { error: batchError } = await supabase
        .from('candidate_batches')
        .delete()
        .eq('id', batchId);

      if (batchError) throw batchError;
      
      // Refetch current page after deletion
      await fetchBatchHistory(currentPage);

      toast({
        title: t('hooks.batchHistory.batchDeleted'),
        description: t('hooks.batchHistory.batchAndCandidatesRemoved'),
      });
    } catch (error) {
      console.error('Error deleting batch:', error);
      toast({
        title: t('hooks.batchHistory.errorDeletingBatch'),
        description: t('hooks.batchHistory.tryAgain'),
        variant: "destructive",
      });
    }
  };

  const deleteAllBatches = async () => {
    try {
      // Delete all candidates for upload source
      const { error: candidatesError } = await supabase
        .from('candidates')
        .delete()
        .eq('source', 'upload')
        .eq('user_id', user?.id);

      if (candidatesError) throw candidatesError;

      // Delete all batches
      const { error: batchError } = await supabase
        .from('candidate_batches')
        .delete()
        .eq('user_id', user?.id);

      if (batchError) throw batchError;
      
      setBatches([]);
      setTotalCount(0);
      setCurrentPage(1);

      // Trigger window event to notify dashboard to refresh stats
      window.dispatchEvent(new CustomEvent('batches-deleted'));

      toast({
        title: t('hooks.batchHistory.allBatchesDeleted'),
        description: t('hooks.batchHistory.allBatchHistoryCleared'),
      });
    } catch (error) {
      console.error('Error deleting all batches:', error);
      toast({
        title: t('hooks.batchHistory.errorDeletingBatches'),
        description: t('hooks.batchHistory.tryAgain'),
        variant: "destructive",
      });
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  useEffect(() => {
    fetchBatchHistory(1);
  }, [user]);

  useEffect(() => {
    // Debounced refresh on analysis completion
    let refreshTimeout: NodeJS.Timeout;
    
    const handleAnalysisCompleted = () => {
      clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => {
        fetchBatchHistory(currentPage, true); // Silent refresh to avoid loading states
      }, 500); // Wait 500ms before refreshing to avoid rapid updates
    };
    
    window.addEventListener('analysis-completed', handleAnalysisCompleted);
    
    return () => {
      clearTimeout(refreshTimeout);
      window.removeEventListener('analysis-completed', handleAnalysisCompleted);
    };
  }, [currentPage]);

  return {
    batches,
    loading,
    refreshing,
    totalCount,
    currentPage,
    totalPages,
    deleteBatch,
    deleteAllBatches,
    refetch: (page?: number) => fetchBatchHistory(page || currentPage),
    goToPage: (page: number) => fetchBatchHistory(page),
  };
};