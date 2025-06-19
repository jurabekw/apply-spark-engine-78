
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
        title: "Error loading job postings",
        description: "Please try again later.",
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
        title: "Job posting created",
        description: "Successfully created new job posting.",
      });
      
      return data;
    } catch (error) {
      console.error('Error creating job posting:', error);
      toast({
        title: "Error creating job posting",
        description: "Please try again.",
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
