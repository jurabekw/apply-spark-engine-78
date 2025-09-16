import React from 'react';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { useTranslation } from 'react-i18next';
import { Clock, Activity, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

/**
 * TrialStatusBanner Component - Shows trial time and usage information
 * 
 * Features:
 * - Displays both time remaining and analyses used/remaining
 * - Color-coded urgency indicators based on time and usage
 * - Progress bar for visual usage representation
 * - Bilingual support (English/Russian)
 * - Responsive design
 */
export const TrialStatusBanner: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { 
    hasActiveTrial, 
    isExpired, 
    timeRemaining, 
    hoursRemaining,
    analysesUsed,
    analysesLimit,
    analysesRemaining,
    usagePercentage,
    isTimeExpired,
    isUsageExpired,
    loading 
  } = useTrialStatus();

  // Don't show banner if loading, expired, or no active trial
  if (loading || !hasActiveTrial || isExpired) {
    return null;
  }

  // Determine urgency level for color coding
  const getUrgencyLevel = (): 'low' | 'medium' | 'high' => {
    const timeUrgent = hoursRemaining <= 24;
    const usageUrgent = usagePercentage >= 75;
    
    if (timeUrgent || usageUrgent) return 'high';
    if (hoursRemaining <= 48 || usagePercentage >= 50) return 'medium';
    return 'low';
  };

  const urgency = getUrgencyLevel();

  // Get appropriate colors based on urgency
  const getVariant = () => {
    switch (urgency) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  // Format time remaining with proper Russian localization
  const formatTimeRemaining = (timeString: string): string => {
    if (i18n.language === 'ru') {
      return timeString
        .replace(/(\d+)\s+day(s)?/g, (match, num) => {
          const n = parseInt(num);
          if (n === 1) return `${n} день`;
          if (n >= 2 && n <= 4) return `${n} дня`;
          return `${n} дней`;
        })
        .replace(/(\d+)\s+hour(s)?/g, (match, num) => {
          const n = parseInt(num);
          if (n === 1 || (n % 10 === 1 && n % 100 !== 11)) return `${n} час`;
          if ((n >= 2 && n <= 4) || (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20))) return `${n} часа`;
          return `${n} часов`;
        });
    }
    return timeString;
  };

  const getProgressColor = () => {
    switch (urgency) {
      case 'high': return 'bg-destructive';
      case 'medium': return 'bg-orange-500';
      case 'low': return 'bg-primary';
      default: return 'bg-primary';
    }
  };

  return (
    <Alert variant={getVariant()} className="border-l-4 border-l-primary">
      <div className="flex items-start gap-3">
        {urgency === 'high' ? (
          <AlertTriangle className="h-4 w-4 mt-0.5 text-destructive" />
        ) : (
          <Clock className="h-4 w-4 mt-0.5 text-primary" />
        )}
        
        <div className="flex-1 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <AlertDescription className="font-medium">
              {t('trial.banner.title')}
            </AlertDescription>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {formatTimeRemaining(timeRemaining)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Activity className="w-3 h-3 mr-1" />
                {analysesRemaining} {t('trial.banner.analysesLeft')}
              </Badge>
            </div>
          </div>
          
          {/* Usage Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {t('trial.banner.usage')}: {analysesUsed}/{analysesLimit}
              </span>
              <span>{usagePercentage}%</span>
            </div>
            <Progress 
              value={usagePercentage} 
              className="h-2"
            />
          </div>
          
          {/* Warning messages based on urgency */}
          {urgency === 'high' && (
            <div className="text-sm">
              {isTimeExpired ? (
                <span className="text-destructive font-medium">
                  {t('trial.banner.timeExpired')}
                </span>
              ) : isUsageExpired ? (
                <span className="text-destructive font-medium">
                  {t('trial.banner.usageExpired')}
                </span>
              ) : hoursRemaining <= 24 ? (
                <span className="text-destructive font-medium">
                  {t('trial.banner.timeRunningOut')}
                </span>
              ) : usagePercentage >= 75 ? (
                <span className="text-destructive font-medium">
                  {t('trial.banner.usageRunningOut')}
                </span>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
};