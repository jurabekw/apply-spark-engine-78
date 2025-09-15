
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export interface JobPosting {
  id: string;
  title: string;
  description?: string;
  requirements: string;
  skills_required?: string[];
  experience_level?: string;
  department?: string;
  location?: string;
  salary_range?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useJobPostings = () => {
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const fetchJobPostings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobPostings(data || []);
    } catch (error) {
      console.error('Error fetching job postings:', error);
      toast({
        title: t('hooks.jobPostings.errorLoadingJobPostings'),
        description: t('hooks.jobPostings.tryAgainLater'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createJobPosting = async (jobData: Omit<JobPosting, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('job_postings')
        .insert([{ 
          ...jobData, 
          user_id: user.id 
        }])
        .select()
        .single();

      if (error) throw error;
      
      setJobPostings(prev => [data, ...prev]);
      toast({
        title: t('hooks.jobPostings.jobPostingCreated'),
        description: t('hooks.jobPostings.jobPostingCreatedSuccessfully'),
      });
      
      return data;
    } catch (error) {
      console.error('Error creating job posting:', error);
      toast({
        title: t('hooks.jobPostings.errorCreatingJobPosting'),
        description: t('hooks.jobPostings.tryAgain'),
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    fetchJobPostings();
  }, [user]);

  return {
    jobPostings,
    loading,
    createJobPosting,
    refetch: fetchJobPostings,
  };
};
