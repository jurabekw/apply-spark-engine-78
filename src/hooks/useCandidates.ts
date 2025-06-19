
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  position?: string;
  experience_years?: number;
  skills?: string[];
  education?: string;
  work_history?: string;
  resume_file_path?: string;
  cover_letter?: string;
  ai_score?: number;
  ai_analysis?: any;
  status: string;
  source: string;
  submitted_at?: string;
  created_at: string;
}

export const useCandidates = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCandidates = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCandidates(data || []);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      toast({
        title: "Error loading candidates",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCandidateStatus = async (candidateId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('candidates')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', candidateId);

      if (error) throw error;
      
      setCandidates(prev => 
        prev.map(candidate => 
          candidate.id === candidateId 
            ? { ...candidate, status }
            : candidate
        )
      );

      toast({
        title: "Status updated",
        description: "Candidate status has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating candidate status:', error);
      toast({
        title: "Error updating status",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [user]);

  return {
    candidates,
    loading,
    updateCandidateStatus,
    refetch: fetchCandidates,
  };
};
