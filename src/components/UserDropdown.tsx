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
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url || ''} alt="User" />
            <AvatarFallback className="text-xs">
              {user?.email ? getInitials(user.email) : 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-64 bg-background/95 backdrop-blur-sm border shadow-lg" align="end">
        <DropdownMenuLabel className="font-normal p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-border">
              <AvatarImage src={profile?.avatar_url || ''} alt="User" />
              <AvatarFallback className="text-sm font-medium">
                {user?.email ? getInitials(user.email) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <p className="text-base font-semibold text-foreground leading-tight">
                {getDisplayName()}
              </p>
              <p className="text-sm text-muted-foreground/80 font-medium mt-0.5">
                {profile?.role || 'Recruiter'}
              </p>
              {user?.email && (
                <p className="text-xs text-muted-foreground/60 mt-1 truncate">
                  {user.email}
                </p>
              )}
              {profile?.company && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Building className="h-3 w-3 text-muted-foreground/50" />
                  <span className="text-xs text-muted-foreground/60 truncate">
                    {profile.company}
                  </span>
                </div>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        
        {/* Simplified Trial Status Section */}
        {hasActiveTrial && (
          <>
            <DropdownMenuSeparator className="my-1" />
            <div className="px-4 py-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    getTrialUrgency() === 'critical' ? 'bg-destructive' : 
                    getTrialUrgency() === 'warning' ? 'bg-yellow-500' : 'bg-primary'
                  }`} />
                  <span className="text-sm text-foreground">
                    {t('trial.title', 'Free Trial')}
                  </span>
                  <span className="text-sm text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">
                    {isExpired ? t('trial.expired', 'Expired') : 
                     daysRemaining > 0 ? `${daysRemaining} days left` : `${hoursRemaining} hours left`}
                  </span>
                </div>
              </div>
              
              <Button 
                size="sm" 
                variant="outline"
                className="w-full text-xs font-medium h-8 border-primary/20 text-primary hover:bg-primary/5"
              >
                {getTrialUrgency() === 'critical' ? 'Upgrade Now' : 'Upgrade Plan'}
              </Button>
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