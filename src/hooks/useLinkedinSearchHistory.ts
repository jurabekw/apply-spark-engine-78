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
  const [refreshing, setRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const fetchSearchHistory = async (page: number = 1, silent = false) => {
    if (!user) return;
    
    if (!silent) setLoading(true);
    else setRefreshing(true);
    
    try {
      const offset = (page - 1) * itemsPerPage;
      
      // Get total count
      const { count } = await supabase
        .from('linkedin_searches')
        .select('*', { count: 'exact', head: true });
      
      // Get paginated data
      const { data, error } = await supabase
        .from('linkedin_searches')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + itemsPerPage - 1);

      if (error) throw error;
      setSearches(data || []);
      setTotalCount(count || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching LinkedIn search history:', error);
      if (!silent) {
        toast({
          title: t('linkedinSearch.toasts.loadErrorTitle'),
          description: t('linkedinSearch.toasts.loadErrorDesc'),
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const deleteSearch = async (searchId: string) => {
    try {
      const { error } = await supabase
        .from('linkedin_searches')
        .delete()
        .eq('id', searchId);

      if (error) throw error;
      
      // Refetch current page after deletion
      await fetchSearchHistory(currentPage);

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
      setTotalCount(0);
      setCurrentPage(1);

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

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Add debounced refresh listener for linkedin-search-completed event
  useEffect(() => {
    const handleSearchCompleted = () => {
      // Debounce the refresh to prevent rapid successive calls
      setTimeout(() => {
        fetchSearchHistory(currentPage, true); // silent refresh
      }, 1000);
    };

    window.addEventListener('linkedin-search-completed', handleSearchCompleted);
    return () => {
      window.removeEventListener('linkedin-search-completed', handleSearchCompleted);
    };
  }, [currentPage]);

  useEffect(() => {
    fetchSearchHistory(1);
  }, [user]);

  return {
    searches,
    loading,
    refreshing,
    totalCount,
    currentPage,
    totalPages,
    deleteSearch,
    deleteAllSearches,
    refetch: (page?: number) => fetchSearchHistory(page || currentPage),
    goToPage: (page: number) => fetchSearchHistory(page),
  };
};