import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface SearchHistory {
  id: string;
  job_title: string;
  required_skills: string;
  experience_level: string;
  city?: string;
  candidate_count: number;
  created_at: string;
  response: any;
}

export const useSearchHistory = () => {
  const [searches, setSearches] = useState<SearchHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const fetchSearchHistory = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('hh_searches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSearches(data || []);
    } catch (error) {
      console.error('Error fetching search history:', error);
      toast({
        title: t('hooks.searchHistory.errorLoadingSearchHistory'),
        description: t('hooks.searchHistory.tryAgainLater'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteSearch = async (searchId: string) => {
    try {
      const { error } = await supabase
        .from('hh_searches')
        .delete()
        .eq('id', searchId);

      if (error) throw error;
      
      setSearches(prev => prev.filter(search => search.id !== searchId));

      toast({
        title: t('hooks.searchHistory.searchDeleted'),
        description: t('hooks.searchHistory.searchHistoryRemoved'),
      });
    } catch (error) {
      console.error('Error deleting search:', error);
      toast({
        title: t('hooks.searchHistory.errorDeletingSearch'),
        description: t('hooks.searchHistory.tryAgain'),
        variant: "destructive",
      });
    }
  };

  const deleteAllSearches = async () => {
    try {
      const { error } = await supabase
        .from('hh_searches')
        .delete()
        .eq('user_id', user?.id);

      if (error) throw error;
      
      setSearches([]);

      // Trigger a window event to notify dashboard to refresh stats
      window.dispatchEvent(new CustomEvent('searches-deleted'));

      toast({
        title: t('hooks.searchHistory.allSearchesDeleted'),
        description: t('hooks.searchHistory.searchHistoryCleared'),
      });
    } catch (error) {
      console.error('Error deleting all searches:', error);
      toast({
        title: t('hooks.searchHistory.errorDeletingSearches'),
        description: t('hooks.searchHistory.tryAgain'),
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