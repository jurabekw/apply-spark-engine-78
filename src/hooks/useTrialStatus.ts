import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TrialData {
  id: string;
  user_id: string;
  trial_started_at: string;
  trial_ends_at: string;
  is_active: boolean;
  analyses_used: number;
  analyses_limit: number;
  created_at: string;
  updated_at: string;
}

interface TrialStatus {
  loading: boolean;
  hasActiveTrial: boolean;
  isExpired: boolean;
  hoursRemaining: number;
  daysRemaining: number;
  timeRemaining: string;
  trialEndsAt: Date | null;
  analysesUsed: number;
  analysesLimit: number;
  analysesRemaining: number;
  usagePercentage: number;
  isUsageExpired: boolean;
  isTimeExpired: boolean;
  error: string | null;
}

/**
 * Custom hook for managing user trial status
 * 
 * Features:
 * - Automatically creates trial on first login (72 hours from signup)
 * - Calculates remaining time in human-readable format
 * - Determines if trial is active or expired
 * - Provides real-time updates of trial status
 * - One trial per user (no renewals or extensions)
 * 
 * @returns TrialStatus object with all trial information
 */
export const useTrialStatus = (): TrialStatus => {
  const { user } = useAuth();
  const [trialData, setTrialData] = useState<TrialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch or create trial data for the current user
  const fetchTrialData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First, try to get existing trial
      const { data: existingTrial, error: fetchError } = await supabase
        .from('user_trials')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching trial:', fetchError);
        setError('Failed to load trial information');
        return;
      }

      if (existingTrial) {
        // User already has a trial
        setTrialData(existingTrial);
      } else {
        // Create new trial for user (auto-triggered by database trigger)
        // This should happen automatically, but we'll check again
        const { data: newTrial, error: createError } = await supabase
          .from('user_trials')
          .insert({
            user_id: user.id,
            trial_started_at: new Date().toISOString(),
            trial_ends_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 72 hours from now
            is_active: true
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating trial:', createError);
          setError('Failed to initialize trial');
          return;
        }

        setTrialData(newTrial);
      }
    } catch (err) {
      console.error('Unexpected error in fetchTrialData:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Calculate time remaining in trial
  const calculateTimeRemaining = (): { hours: number; days: number; timeString: string; expired: boolean } => {
    if (!trialData) {
      return { hours: 0, days: 0, timeString: '0 hours', expired: true };
    }

    const now = new Date();
    const trialEnd = new Date(trialData.trial_ends_at);
    const timeDiff = trialEnd.getTime() - now.getTime();

    // If time difference is negative, trial has expired
    if (timeDiff <= 0) {
      return { hours: 0, days: 0, timeString: '0 hours', expired: true };
    }

    const hoursRemaining = Math.floor(timeDiff / (1000 * 60 * 60));
    const daysRemaining = Math.floor(hoursRemaining / 24);
    const remainingHoursInDay = hoursRemaining % 24;

    // Format time string based on remaining time
    let timeString = '';
    if (daysRemaining > 0) {
      if (remainingHoursInDay > 0) {
        timeString = `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} ${remainingHoursInDay} ${remainingHoursInDay === 1 ? 'hour' : 'hours'}`;
      } else {
        timeString = `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`;
      }
    } else {
      timeString = `${hoursRemaining} ${hoursRemaining === 1 ? 'hour' : 'hours'}`;
    }

    return {
      hours: hoursRemaining,
      days: daysRemaining,
      timeString,
      expired: false
    };
  };

  // Load trial data when user changes
  useEffect(() => {
    if (user) {
      fetchTrialData();
    } else {
      setTrialData(null);
      setLoading(false);
    }
  }, [user]);

  // Calculate current trial status
  const timeCalculation = calculateTimeRemaining();
  const isTimeExpired = timeCalculation.expired;
  const analysesUsed = trialData?.analyses_used || 0;
  const analysesLimit = trialData?.analyses_limit || 20;
  const analysesRemaining = Math.max(0, analysesLimit - analysesUsed);
  const usagePercentage = Math.round((analysesUsed / analysesLimit) * 100);
  const isUsageExpired = analysesUsed >= analysesLimit;
  const isExpired = isTimeExpired || isUsageExpired || !trialData?.is_active;
  const hasActiveTrial = !isExpired && trialData !== null;

  return {
    loading,
    hasActiveTrial,
    isExpired,
    hoursRemaining: timeCalculation.hours,
    daysRemaining: timeCalculation.days,
    timeRemaining: timeCalculation.timeString,
    trialEndsAt: trialData ? new Date(trialData.trial_ends_at) : null,
    analysesUsed,
    analysesLimit,
    analysesRemaining,
    usagePercentage,
    isUsageExpired,
    isTimeExpired,
    error
  };
};