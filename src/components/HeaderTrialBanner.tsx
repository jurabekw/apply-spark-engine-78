import React, { useState } from 'react';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Info, CreditCard, Zap } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { enUS, ru } from 'date-fns/locale';

/**
 * Enhanced trial banner for header - comprehensive credit display with bilingual support
 */
export const HeaderTrialBanner: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);
  const { 
    hasActiveTrial, 
    isExpired, 
    analysesUsed,
    analysesLimit,
    analysesRemaining,
    usagePercentage,
    trialEndsAt,
    loading,
    error
  } = useTrialStatus();

  // Don't show banner if loading, expired, or no active trial
  if (loading || !hasActiveTrial || isExpired) {
    return null;
  }

  // Calculate status based on remaining credits
  const getStatus = (): 'high' | 'medium' | 'low' => {
    const remainingPercent = (analysesRemaining / analysesLimit) * 100;
    if (remainingPercent >= 70) return 'high';
    if (remainingPercent >= 30) return 'medium';
    return 'low';
  };

  const status = getStatus();
  const remainingPercent = Math.round((analysesRemaining / analysesLimit) * 100);

  // Get colors based on status
  const getStatusColors = () => {
    switch (status) {
      case 'high': return {
        progress: 'bg-emerald-500',
        text: 'text-emerald-600',
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        border: 'border-emerald-200 dark:border-emerald-800'
      };
      case 'medium': return {
        progress: 'bg-amber-500',
        text: 'text-amber-600',
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        border: 'border-amber-200 dark:border-amber-800'
      };
      case 'low': return {
        progress: 'bg-red-500',
        text: 'text-red-600',
        bg: 'bg-red-50 dark:bg-red-950/30',
        border: 'border-red-200 dark:border-red-800'
      };
    }
  };

  const colors = getStatusColors();

  // Format refresh date
  const formatRefreshDate = () => {
    if (!trialEndsAt) return '';
    const locale = i18n.language === 'ru' ? ru : enUS;
    const refreshDate = addDays(trialEndsAt, 1); // Assume refresh next day after trial
    return format(refreshDate, 'MMM d', { locale });
  };

  // Handle error state
  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-muted/50">
        <Info className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          {t('trial.banner.loadError')}
        </span>
      </div>
    );
  }

  const handleDetailsClick = () => {
    setShowDetails(!showDetails);
    // Here you could navigate to a detailed credit history page
    console.log('Navigate to credit history');
  };

  const handleUpgradeClick = () => {
    // Here you could navigate to upgrade page or open modal
    console.log('Navigate to upgrade');
  };

  return (
    <div className="flex items-center gap-2 relative">
      {/* Main Credit Display */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleDetailsClick}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200
              hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/20
              ${colors.bg} ${colors.border}
            `}
            aria-label={t('trial.banner.viewDetails')}
          >
            {/* Credit Info */}
            <div className="flex flex-col items-start min-w-0">
              {/* Usage Text */}
              <div className="flex items-center gap-1">
                <span className={`text-xs font-medium ${colors.text}`}>
                  {t('trial.banner.creditsUsed', { 
                    used: analysesUsed, 
                    total: analysesLimit 
                  })}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-20 mt-1">
                <Progress 
                  value={usagePercentage} 
                  className="h-1.5"
                />
              </div>
              
              {/* Percentage */}
              <div className="flex items-center gap-1 mt-1">
                <span className={`text-xs ${colors.text}`}>
                  {t('trial.banner.creditsRemaining', { remaining: remainingPercent })}
                </span>
                {status === 'low' && (
                  <Zap className="w-3 h-3 text-red-500" />
                )}
              </div>
            </div>

            {/* Status Badge */}
            <Badge 
              variant={status === 'low' ? 'destructive' : status === 'medium' ? 'secondary' : 'default'}
              className="text-xs px-1 py-0"
            >
              {analysesRemaining}
            </Badge>
          </button>
        </TooltipTrigger>
        
        <TooltipContent 
          side="bottom" 
          className="max-w-64 p-3"
          sideOffset={5}
        >
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {t('trial.banner.creditsUsed', { 
                used: analysesUsed, 
                total: analysesLimit 
              })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('trial.banner.tooltip')}
            </p>
            {formatRefreshDate() && (
              <p className="text-xs text-muted-foreground">
                {t('trial.banner.refreshes', { date: formatRefreshDate() })}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>

      {/* Action Button for Low Credits */}
      {status === 'low' && (
        <Button
          onClick={handleUpgradeClick}
          size="sm"
          className="text-xs px-2 py-1 h-auto"
          variant={status === 'low' ? 'destructive' : 'outline'}
        >
          <CreditCard className="w-3 h-3 mr-1" />
          {t('trial.banner.upgradeButton')}
        </Button>
      )}

      {/* Expanded Details Modal/Dropdown */}
      {showDetails && (
        <div className="absolute top-full right-0 mt-2 p-4 rounded-lg border shadow-lg z-50 min-w-64 bg-background border-border">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Credit Usage Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Credits:</span>
                <span>{analysesLimit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Used:</span>
                <span>{analysesUsed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Remaining:</span>
                <span className={colors.text}>{analysesRemaining}</span>
              </div>
              {formatRefreshDate() && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Refreshes:</span>
                  <span>{formatRefreshDate()}</span>
                </div>
              )}
            </div>

            <Button
              onClick={handleUpgradeClick}
              size="sm"
              className="w-full"
              variant={status === 'low' ? 'destructive' : 'outline'}
            >
              {t('trial.banner.upgradeButton')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};