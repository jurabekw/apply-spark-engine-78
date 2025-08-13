import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SearchHistory {
  id: string;
  job_title: string;
  required_skills: string;
  experience_level: string;
  candidate_count: number;
  created_at: string;
  response: any;
}

export const useSearchHistory = () => {
  const [searches, setSearches] = useState<SearchHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

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
        title: "Error loading search history",
        description: "Please try again later.",
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
        title: "Search deleted",
        description: "Search history entry has been removed.",
      });
    } catch (error) {
      console.error('Error deleting search:', error);
      toast({
        title: "Error deleting search",
        description: "Please try again.",
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

      toast({
        title: "All searches deleted",
        description: "Search history has been cleared.",
      });
    } catch (error) {
      console.error('Error deleting all searches:', error);
      toast({
        title: "Error deleting searches",
        description: "Please try again.",
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