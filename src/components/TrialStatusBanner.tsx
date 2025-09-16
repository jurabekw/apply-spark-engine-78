import React from 'react';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { useTranslation } from 'react-i18next';
import { Clock, BarChart3, AlertTriangle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

/**
 * TrialStatusBanner Component - Shows trial status in header
 * 
 * Features:
 * - Displays time remaining and usage statistics
 * - Color-coded urgency indicators
 * - Progress bars for time and usage
 * - Contact button when approaching limits
 * - Bilingual support
 */
export const TrialStatusBanner: React.FC = () => {
  const { t } = useTranslation();
  const { 
    loading, 
    hasActiveTrial, 
    isExpired, 
    timeRemaining, 
    hoursRemaining,
    analysesUsed, 
    analysesLimit, 
    analysesRemaining, 
    usagePercentage, 
    error 
  } = useTrialStatus();

  // Don't show banner if loading, no trial, or expired
  if (loading || !hasActiveTrial || isExpired || error) {
    return null;
  }

  // Determine urgency level for styling
  const getUrgencyLevel = (): 'low' | 'medium' | 'high' => {
    const timeUrgent = hoursRemaining <= 24;
    const usageUrgent = usagePercentage >= 80;
    
    if (timeUrgent || usageUrgent) return 'high';
    if (hoursRemaining <= 48 || usagePercentage >= 60) return 'medium';
    return 'low';
  };

  const urgency = getUrgencyLevel();
  
  // Get urgency-based styling
  const getUrgencyStyles = () => {
    switch (urgency) {
      case 'high':
        return {
          variant: 'destructive' as const,
          icon: AlertTriangle,
          progressColor: 'bg-destructive'
        };
      case 'medium':
        return {
          variant: 'default' as const,
          icon: Clock,
          progressColor: 'bg-yellow-500'
        };
      default:
        return {
          variant: 'default' as const,
          icon: Clock,
          progressColor: 'bg-primary'
        };
    }
  };

  const { variant, icon: Icon, progressColor } = getUrgencyStyles();
  
  const handleContactSupport = () => {
    window.open('https://t.me/shakhnoz_burkhan', '_blank');
  };

  const timePercentage = Math.max(0, Math.min(100, (hoursRemaining / 72) * 100));

  return (
    <Alert variant={variant} className="mb-4">
      <Icon className="h-4 w-4" />
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="font-medium">
            {t('trial.banner.title', { defaultValue: 'Free Trial Active' })}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {/* Time Remaining */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {t('trial.banner.timeRemaining', { defaultValue: 'Time Remaining' })}
                </span>
                <span className="font-medium">{timeRemaining}</span>
              </div>
              <Progress 
                value={timePercentage} 
                className="h-1"
                style={{ 
                  '--progress-foreground': urgency === 'high' ? 'hsl(var(--destructive))' : 
                                          urgency === 'medium' ? 'hsl(45 93% 47%)' : 
                                          'hsl(var(--primary))'
                } as React.CSSProperties}
              />
            </div>

            {/* Usage Remaining */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  {t('trial.banner.analysesRemaining', { defaultValue: 'Analyses Remaining' })}
                </span>
                <span className="font-medium">{analysesRemaining} / {analysesLimit}</span>
              </div>
              <Progress 
                value={100 - usagePercentage} 
                className="h-1"
                style={{ 
                  '--progress-foreground': urgency === 'high' ? 'hsl(var(--destructive))' : 
                                          urgency === 'medium' ? 'hsl(45 93% 47%)' : 
                                          'hsl(var(--primary))'
                } as React.CSSProperties}
              />
            </div>
          </div>
        </div>

        {/* Contact button for urgent cases */}
        {urgency === 'high' && (
          <Button 
            onClick={handleContactSupport}
            variant="outline"
            size="sm"
            className="shrink-0"
          >
            <ExternalLink className="mr-2 h-3 w-3" />
            {t('trial.banner.contact', { defaultValue: 'Contact Support' })}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};