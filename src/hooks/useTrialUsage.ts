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

      // If no trial found, create one
      if (!trial) {
        console.log('No trial found, creating one for user:', user.id);
        const { error: insertError } = await supabase
          .from('user_trials')
          .insert({ user_id: user.id });
        
        if (insertError) {
          console.error('Failed to create trial:', insertError);
          setError('Failed to initialize trial');
          return;
        }
        
        // Retry fetching after creating
        const { data: newTrial, error: retryError } = await supabase
          .from('user_trials')
          .select('analyses_used, analyses_limit, is_active, trial_ends_at')
          .eq('user_id', user.id)
          .single();
          
        if (retryError || !newTrial) {
          console.error('Failed to fetch created trial:', retryError);
          setError('Failed to load trial information');
          return;
        }
        
        // Use the newly created trial
        const analysesUsed = 0;
        const analysesLimit = 20;
        const analysesRemaining = analysesLimit;
        const usagePercentage = 0;

        setUsageData({
          analysesUsed,
          analysesLimit,
          analysesRemaining,
          usagePercentage,
          canUseAnalysis: true,
        });
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

    // Helper to call RPC and normalize response shape
    const callIncrement = async () => {
      const { data, error } = await supabase.rpc('increment_trial_usage', {
        p_user_id: user.id,
        p_module_type: moduleType,
        p_metadata: metadata
      });
      if (error) return { ok: false as const, message: error.message };
      const row = Array.isArray(data) ? data?.[0] : data;
      return { ok: Boolean(row?.success), message: String(row?.message || ''), analyses_used: row?.analyses_used, analyses_remaining: row?.analyses_remaining };
    };

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

      // Try to record usage
      let result = await callIncrement();

      // If trial not found, try to create it and retry once
      if (!result.ok && /trial not found/i.test(result.message || '')) {
        const { error: insertErr } = await supabase
          .from('user_trials')
          .insert({ user_id: user.id })
          .select('id')
          .single();

        if (insertErr) {
          console.error('Failed to create trial for user:', insertErr);
          toast({
            title: t('trial.errors.trialNotFound'),
            description: t('trial.errors.contactSupport'),
            variant: 'destructive',
          });
          return false;
        }

        // Retry once after creating the trial
        result = await callIncrement();
      }

      if (!result.ok) {
        console.error('Error recording usage (handled):', result.message);
        if (/expired|limit/i.test(result.message || '')) {
          toast({
            title: t('trial.errors.limitReached'),
            description: t('trial.errors.limitReachedDesc'),
            variant: 'destructive',
          });
        } else {
          toast({
            title: t('trial.errors.recordingFailed'),
            description: t('trial.errors.tryAgain'),
            variant: 'destructive',
          });
        }
        // Ensure local state reflects latest from server
        await fetchUsageData();
        return false;
      }

      // Refresh usage data after successful recording
      await fetchUsageData();
      // Notify other parts of the app (e.g., headers using useTrialStatus)
      try {
        window.dispatchEvent(new Event('trial-usage-updated'));
      } catch {}

      // Show usage warning if approaching limit using server-returned remaining when available
      const remaining = typeof result.analyses_remaining === 'number'
        ? result.analyses_remaining
        : (usageData.analysesLimit - (usageData.analysesUsed + 1));

      if (remaining === 5) {
        toast({
          title: t('trial.warnings.approaching'),
          description: t('trial.warnings.fiveLeft'),
          variant: 'default',
        });
      } else if (remaining === 1) {
        toast({
          title: t('trial.warnings.lastAnalysis'),
          description: t('trial.warnings.lastAnalysisDesc'),
          variant: 'default',
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