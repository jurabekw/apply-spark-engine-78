import React from 'react';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';

/**
 * Minimalistic trial banner for header - shows only remaining credits with progress bar
 */
export const HeaderTrialBanner: React.FC = () => {
  const { t } = useTranslation();
  const { 
    hasActiveTrial, 
    isExpired, 
    analysesRemaining,
    usagePercentage,
    loading 
  } = useTrialStatus();

  // Don't show banner if loading, expired, or no active trial
  if (loading || !hasActiveTrial || isExpired) {
    return null;
  }

  // Determine color based on remaining credits
  const getProgressColor = () => {
    if (analysesRemaining <= 3) return 'bg-destructive';
    if (analysesRemaining <= 7) return 'bg-orange-500';
    return 'bg-primary';
  };

  const getTextColor = () => {
    if (analysesRemaining <= 3) return 'text-destructive';
    if (analysesRemaining <= 7) return 'text-orange-600';
    return 'text-muted-foreground';
  };

  return (
    <div className="flex items-center gap-2 min-w-24">
      <div className="flex flex-col items-end gap-1">
        <span className={`text-xs font-medium ${getTextColor()}`}>
          {analysesRemaining} {t('trial.banner.creditsLeft')}
        </span>
        <Progress 
          value={100 - usagePercentage} 
          className="h-1 w-16"
        />
      </div>
    </div>
  );
};