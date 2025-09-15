import React from 'react';
import { User, Settings, LogOut, Building, Mail, Clock, Zap, AlertTriangle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { useTranslation } from 'react-i18next';

interface UserDropdownProps {
  onSettingsClick: () => void;
}

export const UserDropdown = ({ onSettingsClick }: UserDropdownProps) => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();
  const { hasActiveTrial, isExpired, hoursRemaining, daysRemaining, timeRemaining, trialEndsAt } = useTrialStatus();

  const getInitials = (email: string) => {
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  const getDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  // Trial urgency levels
  const getTrialUrgency = () => {
    if (isExpired) return 'expired';
    if (hoursRemaining <= 6) return 'critical';
    if (hoursRemaining <= 24) return 'warning';
    if (daysRemaining <= 1) return 'medium';
    return 'low';
  };

  const getCircularProgress = () => {
    if (isExpired) return 0;
    const totalHours = 72; // 3 days
    return Math.max(0, Math.min(100, (hoursRemaining / totalHours) * 100));
  };

  const getCircularProgressColor = () => {
    const progress = getCircularProgress();
    if (progress > 66) return 'text-emerald-500'; // 3 days - green
    if (progress > 33) return 'text-yellow-500'; // 2 days - yellow
    return 'text-orange-500'; // 1 day - orange
  };

  const getTrialProgressPercent = () => {
    if (isExpired) return 0;
    const totalHours = 72; // 3 days
    return Math.max(0, Math.min(100, (hoursRemaining / totalHours) * 100));
  };

  const getTrialIcon = () => {
    const urgency = getTrialUrgency();
    if (urgency === 'expired' || urgency === 'critical') return AlertTriangle;
    if (urgency === 'warning') return Clock;
    return Zap;
  };

  const getTrialVariant = () => {
    const urgency = getTrialUrgency();
    if (urgency === 'expired') return 'destructive';
    if (urgency === 'critical') return 'destructive';
    if (urgency === 'warning') return 'warning';
    return 'brand';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full">
          {/* Circular Progress Ring */}
          {hasActiveTrial && (
            <div className="absolute inset-0 w-8 h-8">
              <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
                <circle
                  cx="16"
                  cy="16"
                  r="15"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="text-muted-foreground/20"
                />
                <circle
                  cx="16"
                  cy="16"
                  r="15"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="94.25"
                  strokeDashoffset={94.25 - (94.25 * getCircularProgress()) / 100}
                  className={`${getCircularProgressColor()} transition-all duration-300`}
                />
              </svg>
            </div>
          )}
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url || ''} alt="User" />
            <AvatarFallback className="text-xs">
              {user?.email ? getInitials(user.email) : 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-60" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || ''} alt="User" />
                <AvatarFallback className="text-xs">
                  {user?.email ? getInitials(user.email) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <p className="text-sm font-medium leading-none">
                  {getDisplayName()}
                </p>
                <p className="text-xs leading-none text-muted-foreground mt-1">
                  {profile?.role || 'Recruiter'}
                </p>
              </div>
            </div>
            
            <div className="space-y-1 text-xs text-muted-foreground">
              {user?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{user.email}</span>
                </div>
              )}
              {profile?.company && (
                <div className="flex items-center gap-2">
                  <Building className="h-3 w-3" />
                  <span className="truncate">{profile.company}</span>
                </div>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        
        {/* Trial Status Section */}
        {hasActiveTrial && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {React.createElement(getTrialIcon(), { 
                    className: `h-4 w-4 ${getTrialUrgency() === 'critical' ? 'text-destructive' : 'text-primary'}` 
                  })}
                  <span className="text-sm font-medium">
                    {t('trial.title', 'Free Trial')}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3">
                    <svg className="w-3 h-3 transform -rotate-90" viewBox="0 0 24 24">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        className="text-muted-foreground/20"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray="62.83"
                        strokeDashoffset={62.83 - (62.83 * getCircularProgress()) / 100}
                        className={`${getCircularProgressColor()} transition-all duration-300`}
                      />
                    </svg>
                  </div>
                  <span className="text-xs font-medium">
                    {isExpired ? t('trial.expired', 'Expired') : 
                     daysRemaining > 0 ? `${daysRemaining}d` : `${hoursRemaining}h`}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Progress 
                  value={getTrialProgressPercent()} 
                  className={`h-2 ${
                    getTrialUrgency() === 'critical' ? 'bg-destructive/20' : 
                    getTrialUrgency() === 'warning' ? 'bg-warning/20' : 'bg-primary/20'
                  }`}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {t(`trial.stage.${getTrialUrgency()}.timeLeft`, `${timeRemaining} remaining`)}
                  </span>
                  <span className="text-primary font-medium">
                    {Math.round(getTrialProgressPercent())}%
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {t(`trial.stage.${getTrialUrgency()}.message`, 
                    getTrialUrgency() === 'critical' 
                      ? 'Your trial expires soon! Upgrade now to keep access.'
                      : getTrialUrgency() === 'warning'
                      ? 'Less than 24 hours left. Don\'t lose your progress!'
                      : 'Explore all features during your free trial.'
                  )}
                </p>
                <Button 
                  size="sm" 
                  className="w-full text-xs" 
                  variant={getTrialUrgency() === 'critical' ? 'destructive' : 'default'}
                >
                  {t(`trial.stage.${getTrialUrgency()}.cta`, 'Upgrade Now')}
                </Button>
              </div>
            </div>
          </>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={(e) => {
            e.preventDefault();
            onSettingsClick();
          }}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>{t('header.settings', 'Settings')}</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={(e) => {
            e.preventDefault();
            signOut();
          }}
          className="text-red-600 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('header.logout', 'Logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};