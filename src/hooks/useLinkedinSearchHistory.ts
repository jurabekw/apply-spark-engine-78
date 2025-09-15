import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface LinkedinSearchHistory {
  id: string;
  job_title: string;
  required_skills: string;
  experience_level: string;
  candidate_count: number;
  created_at: string;
  response: any;
}

export const useLinkedinSearchHistory = () => {
  const [searches, setSearches] = useState<LinkedinSearchHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const fetchSearchHistory = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('linkedin_searches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSearches(data || []);
    } catch (error) {
      console.error('Error fetching LinkedIn search history:', error);
      toast({
        title: t('linkedinSearch.toasts.loadErrorTitle'),
        description: t('linkedinSearch.toasts.loadErrorDesc'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteSearch = async (searchId: string) => {
    try {
      const { error } = await supabase
        .from('linkedin_searches')
        .delete()
        .eq('id', searchId);

      if (error) throw error;
      
      setSearches(prev => prev.filter(search => search.id !== searchId));

      toast({
        title: t('linkedinSearch.toasts.deletedTitle'),
        description: t('linkedinSearch.toasts.deletedDesc'),
      });
    } catch (error) {
      console.error('Error deleting LinkedIn search:', error);
      toast({
        title: t('linkedinSearch.toasts.deleteErrorTitle'),
        description: t('linkedinSearch.toasts.deleteErrorDesc'),
        variant: "destructive",
      });
    }
  };

  const deleteAllSearches = async () => {
    try {
      const { error } = await supabase
        .from('linkedin_searches')
        .delete()
        .eq('user_id', user?.id);

      if (error) throw error;
      
      setSearches([]);

      // Trigger a window event to notify dashboard to refresh stats
      window.dispatchEvent(new CustomEvent('linkedin-searches-deleted'));

      toast({
        title: t('linkedinSearch.toasts.clearedAllTitle'),
        description: t('linkedinSearch.toasts.clearedAllDesc'),
      });
    } catch (error) {
      console.error('Error deleting all LinkedIn searches:', error);
      toast({
        title: t('linkedinSearch.toasts.clearErrorTitle'),
        description: t('linkedinSearch.toasts.clearErrorDesc'),
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSearchHistory();
  }, [user]);

  return {
    searches,
    loading,
    deleteSearch,
    deleteAllSearches,
    refetch: fetchSearchHistory,
  };
};