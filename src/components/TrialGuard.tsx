import React from 'react';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Clock, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TrialGuardProps {
  children: React.ReactNode;
  /** Whether to show trial banner when active (default: true) */
  showTrialBanner?: boolean;
  /** Whether to block access when expired (default: true) */
  blockOnExpired?: boolean;
}

/**
 * TrialGuard Component - Manages free trial access control
 * 
 * Features:
 * - Shows trial status banner for active trials
 * - Blocks access with contact modal when trial expires
 * - Color-coded urgency indicators (green > yellow > red)
 * - Bilingual support (English/Russian)
 * - Customizable display options
 * 
 * Usage:
 * ```tsx
 * <TrialGuard>
 *   <ProtectedContent />
 * </TrialGuard>
 * ```
 * 
 * @param children - Content to protect with trial guard
 * @param showTrialBanner - Whether to show trial status banner (default: true)
 * @param blockOnExpired - Whether to block access when expired (default: true)
 */
export const TrialGuard: React.FC<TrialGuardProps> = ({ 
  children, 
  showTrialBanner = true,
  blockOnExpired = true 
}) => {
  const { t } = useTranslation();
  const { loading, hasActiveTrial, isExpired, timeRemaining, hoursRemaining, error } = useTrialStatus();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Determine trial urgency level for color coding
  const getTrialUrgency = (): 'low' | 'medium' | 'high' => {
    if (hoursRemaining > 48) return 'low';    // Green: More than 2 days
    if (hoursRemaining > 24) return 'medium'; // Yellow: 1-2 days
    return 'high';                            // Red: Less than 1 day
  };

  const urgency = getTrialUrgency();

  // Trial banner component
  const TrialBanner = () => {
    if (!hasActiveTrial || !showTrialBanner) return null;

    const bannerVariants = {
      low: 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200',
      medium: 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
      high: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200'
    };

    return (
      <Alert className={`mb-4 ${bannerVariants[urgency]}`}>
        <Clock className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            {t('trial.banner.message')} <strong>{timeRemaining}</strong> {t('trial.banner.remaining')}
          </span>
          {urgency === 'high' && (
            <span className="text-sm font-medium">
              {t('trial.banner.urgent')}
            </span>
          )}
        </AlertDescription>
      </Alert>
    );
  };

  // Expired trial modal
  const ExpiredTrialModal = () => {
    if (!isExpired || !blockOnExpired) return null;

    const handleContactTelegram = () => {
      window.open('https://t.me/shakhnoz_burkhan', '_blank');
    };

    return (
      <Dialog open={true}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t('trial.expired.title')}
            </DialogTitle>
            <DialogDescription>
              {t('trial.expired.message')}
            </DialogDescription>
          </DialogHeader>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('trial.expired.contact.title')}</CardTitle>
              <CardDescription>
                {t('trial.expired.contact.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleContactTelegram}
                className="w-full"
                size="lg"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                {t('trial.expired.contact.telegram')}
              </Button>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <>
      <TrialBanner />
      {!isExpired || !blockOnExpired ? children : null}
      <ExpiredTrialModal />
    </>
  );
};