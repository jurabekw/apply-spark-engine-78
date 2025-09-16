import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface TrialUsageData {
  analysesUsed: number;
  analysesLimit: number;
  analysesRemaining: number;
  usagePercentage: number;
  canUseAnalysis: boolean;
}

interface TrialUsageResult extends TrialUsageData {
  loading: boolean;
  error: string | null;
  recordUsage: (moduleType: string, metadata?: any) => Promise<boolean>;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for managing trial usage tracking
 * 
 * Features:
 * - Tracks analysis usage across all modules (upload, linkedin, hh.uz)
 * - Enforces 20 analysis limit during trial period
 * - Records usage in trial_usage_log for analytics
 * - Provides real-time usage information
 * - Handles concurrent usage attempts safely
 * 
 * @returns TrialUsageResult object with usage data and functions
 */
export const useTrialUsage = (): TrialUsageResult => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usageData, setUsageData] = useState<TrialUsageData>({
    analysesUsed: 0,
    analysesLimit: 20,
    analysesRemaining: 20,
    usagePercentage: 0,
    canUseAnalysis: true,
  });

  // Fetch current trial usage data
  const fetchUsageData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get current trial data
      const { data: trial, error: trialError } = await supabase
        .from('user_trials')
        .select('analyses_used, analyses_limit, is_active, trial_ends_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (trialError) {
        console.error('Error fetching trial usage:', trialError);
        setError('Failed to load usage information');
        return;
      }

      if (!trial) {
        // No trial found - this shouldn't happen if useTrialStatus is working
        setError('Trial not found');
        return;
      }

      // Check if trial is still active (time-wise)
      const now = new Date();
      const trialEnd = new Date(trial.trial_ends_at);
      const timeExpired = now >= trialEnd;
      const usageExpired = trial.analyses_used >= trial.analyses_limit;
      const trialExpired = timeExpired || usageExpired || !trial.is_active;

      const analysesUsed = trial.analyses_used || 0;
      const analysesLimit = trial.analyses_limit || 20;
      const analysesRemaining = Math.max(0, analysesLimit - analysesUsed);
      const usagePercentage = Math.round((analysesUsed / analysesLimit) * 100);

      setUsageData({
        analysesUsed,
        analysesLimit,
        analysesRemaining,
        usagePercentage,
        canUseAnalysis: !trialExpired && analysesRemaining > 0,
      });

    } catch (err) {
      console.error('Unexpected error in fetchUsageData:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Record usage for an analysis
  const recordUsage = useCallback(async (moduleType: string, metadata: any = {}): Promise<boolean> => {
    if (!user) {
      toast({
        title: t('trial.errors.notAuthenticated'),
        description: t('trial.errors.pleaseSignIn'),
        variant: "destructive",
      });
      return false;
    }

    try {
      // First check if user can still use analyses
      if (!usageData.canUseAnalysis) {
        toast({
          title: t('trial.errors.limitReached'),
          description: t('trial.errors.limitReachedDesc'),
          variant: "destructive",
        });
        return false;
      }

      // Use the increment_trial_usage function to safely record usage
      const { data, error } = await supabase.rpc('increment_trial_usage', {
        p_user_id: user.id,
        p_module_type: moduleType,
        p_metadata: metadata
      });

      if (error) {
        console.error('Error recording usage:', error);
        
        // Handle specific error cases
        if (error.message?.includes('Trial has expired') || error.message?.includes('limit reached')) {
          toast({
            title: t('trial.errors.limitReached'),
            description: t('trial.errors.limitReachedDesc'),
            variant: "destructive",
          });
        } else if (error.message?.includes('Trial not found')) {
          toast({
            title: t('trial.errors.trialNotFound'),
            description: t('trial.errors.contactSupport'),
            variant: "destructive",
          });
        } else {
          toast({
            title: t('trial.errors.recordingFailed'),
            description: t('trial.errors.tryAgain'),
            variant: "destructive",
          });
        }
        return false;
      }

      // Refresh usage data after successful recording
      await fetchUsageData();

      // Show usage warning if approaching limit
      const newUsed = usageData.analysesUsed + 1;
      const remaining = usageData.analysesLimit - newUsed;
      
      if (remaining === 5) {
        toast({
          title: t('trial.warnings.approaching'),
          description: t('trial.warnings.fiveLeft'),
          variant: "default",
        });
      } else if (remaining === 1) {
        toast({
          title: t('trial.warnings.lastAnalysis'),
          description: t('trial.warnings.lastAnalysisDesc'),
          variant: "default",
        });
      }

      return true;

    } catch (err) {
      console.error('Unexpected error in recordUsage:', err);
      toast({
        title: t('trial.errors.unexpected'),
        description: t('trial.errors.tryAgain'),
        variant: "destructive",
      });
      return false;
    }
  }, [user, usageData.canUseAnalysis, usageData.analysesUsed, usageData.analysesLimit, fetchUsageData, toast, t]);

  // Load usage data when user changes
  useEffect(() => {
    fetchUsageData();
  }, [fetchUsageData]);

  // Listen for trial usage events to refresh data
  useEffect(() => {
    const handleUsageUpdate = () => {
      fetchUsageData();
    };

    window.addEventListener('trial-usage-updated', handleUsageUpdate);
    return () => {
      window.removeEventListener('trial-usage-updated', handleUsageUpdate);
    };
  }, [fetchUsageData]);

  return {
    ...usageData,
    loading,
    error,
    recordUsage,
    refetch: fetchUsageData,
  };
};