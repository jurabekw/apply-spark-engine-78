import { useTrialStatus } from './useTrialStatus';
import { useToast } from './use-toast';
import { useTranslation } from 'react-i18next';

type ModuleType = 'resume_upload' | 'hh_search' | 'linkedin_search';

interface UseTrialUsageReturn {
  checkAndIncrementUsage: (moduleType: ModuleType, metadata?: any) => Promise<boolean>;
  canUseModule: boolean;
  usageInfo: {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
}

/**
 * Hook for managing trial usage across modules
 * 
 * Features:
 * - Checks trial limits before allowing module usage
 * - Increments usage atomically
 * - Shows appropriate toast messages
 * - Returns usage statistics
 * 
 * Usage:
 * ```tsx
 * const { checkAndIncrementUsage, canUseModule, usageInfo } = useTrialUsage();
 * 
 * const handleAnalysis = async () => {
 *   const canProceed = await checkAndIncrementUsage('resume_upload', { filename: 'resume.pdf' });
 *   if (canProceed) {
 *     // Proceed with analysis
 *   }
 * };
 * ```
 */
export const useTrialUsage = (): UseTrialUsageReturn => {
  const { 
    hasActiveTrial, 
    isExpired, 
    analysesUsed, 
    analysesLimit, 
    analysesRemaining, 
    usagePercentage,
    incrementUsage 
  } = useTrialStatus();
  const { toast } = useToast();
  const { t } = useTranslation();

  const canUseModule = hasActiveTrial && !isExpired && analysesRemaining > 0;

  const checkAndIncrementUsage = async (moduleType: ModuleType, metadata: any = {}): Promise<boolean> => {
    // Check if trial is active
    if (!hasActiveTrial || isExpired) {
      toast({
        title: t('trial.usage.expired.title', { defaultValue: 'Trial Expired' }),
        description: t('trial.usage.expired.description', { defaultValue: 'Your trial has expired. Please contact support to continue.' }),
        variant: 'destructive',
      });
      return false;
    }

    // Check if usage limit would be exceeded
    if (analysesRemaining <= 0) {
      toast({
        title: t('trial.usage.limitReached.title', { defaultValue: 'Usage Limit Reached' }),
        description: t('trial.usage.limitReached.description', { 
          defaultValue: 'You have reached your trial limit of {{limit}} analyses.', 
          limit: analysesLimit 
        }),
        variant: 'destructive',
      });
      return false;
    }

    try {
      // Increment usage
      const result = await incrementUsage(moduleType, metadata);
      
      if (!result.success) {
        let errorMessage = t('trial.usage.error.generic', { defaultValue: 'Unable to process request. Please try again.' });
        
        if (result.error === 'trial_expired') {
          errorMessage = t('trial.usage.error.expired', { defaultValue: 'Your trial has expired.' });
        } else if (result.error === 'usage_limit_exceeded') {
          errorMessage = t('trial.usage.error.limitExceeded', { defaultValue: 'You have reached your usage limit.' });
        } else if (result.error === 'no_active_trial') {
          errorMessage = t('trial.usage.error.noTrial', { defaultValue: 'No active trial found.' });
        }

        toast({
          title: t('trial.usage.error.title', { defaultValue: 'Usage Error' }),
          description: errorMessage,
          variant: 'destructive',
        });
        return false;
      }

      // Show success message with remaining usage
      const remaining = analysesLimit - (analysesUsed + 1);
      if (remaining <= 5 && remaining > 0) {
        toast({
          title: t('trial.usage.warning.title', { defaultValue: 'Usage Warning' }),
          description: t('trial.usage.warning.description', { 
            defaultValue: 'You have {{remaining}} analyses remaining in your trial.', 
            remaining 
          }),
          variant: 'default',
        });
      } else if (remaining === 0) {
        toast({
          title: t('trial.usage.lastAnalysis.title', { defaultValue: 'Last Analysis' }),
          description: t('trial.usage.lastAnalysis.description', { 
            defaultValue: 'This was your last analysis. Contact support to continue.' 
          }),
          variant: 'default',
        });
      }

      return true;
    } catch (error) {
      console.error('Error checking and incrementing usage:', error);
      toast({
        title: t('trial.usage.error.title', { defaultValue: 'Usage Error' }),
        description: t('trial.usage.error.generic', { defaultValue: 'Unable to process request. Please try again.' }),
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    checkAndIncrementUsage,
    canUseModule,
    usageInfo: {
      used: analysesUsed,
      limit: analysesLimit,
      remaining: analysesRemaining,
      percentage: usagePercentage
    }
  };
};