import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchBatchHistory = async () => {
    if (!user) return;
    
    try {
      // Get batches with their candidates
      const { data: batchData, error: batchError } = await supabase
        .from('candidate_batches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

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
    } catch (error) {
      console.error('Error fetching batch history:', error);
      toast({
        title: "Error loading batch history",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
      
      setBatches(prev => prev.filter(batch => batch.id !== batchId));

      toast({
        title: "Batch deleted",
        description: "Batch and all associated candidates have been removed.",
      });
    } catch (error) {
      console.error('Error deleting batch:', error);
      toast({
        title: "Error deleting batch",
        description: "Please try again.",
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

      // Trigger window event to notify dashboard to refresh stats
      window.dispatchEvent(new CustomEvent('batches-deleted'));

      toast({
        title: "All batches deleted",
        description: "All batch history has been cleared.",
      });
    } catch (error) {
      console.error('Error deleting all batches:', error);
      toast({
        title: "Error deleting batches",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchBatchHistory();
    
    // Listen for analysis completion to refresh data
    const handleAnalysisCompleted = () => {
      fetchBatchHistory();
    };
    
    window.addEventListener('analysis-completed', handleAnalysisCompleted);
    
    return () => {
      window.removeEventListener('analysis-completed', handleAnalysisCompleted);
    };
  }, [user]);

  return {
    batches,
    loading,
    deleteBatch,
    deleteAllBatches,
    refetch: fetchBatchHistory,
  };
};