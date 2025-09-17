import React from 'react';
import { User, Settings, LogOut, Building, Mail, Clock, Coins, AlertTriangle, Sparkles } from 'lucide-react';
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
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useCredits } from '@/contexts/CreditContext';
import { CreditDisplay } from '@/components/CreditDisplay';
import { useTranslation } from 'react-i18next';

interface UserDropdownProps {
  onSettingsClick: () => void;
}

export const UserDropdown = ({ onSettingsClick }: UserDropdownProps) => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();
  const { balance } = useCredits();

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

  // Credit status helpers
  const getCreditUrgency = (): 'low' | 'medium' | 'high' => {
    if (balance === 0) return 'high';
    if (balance <= 5) return 'medium';
    return 'low';
  };

  const getCreditIcon = () => {
    const urgency = getCreditUrgency();
    if (urgency === 'high') return <AlertTriangle className="w-3 h-3" />;
    if (urgency === 'medium') return <Clock className="w-3 h-3" />;
    return <Coins className="w-3 h-3" />;
  };

  const getCreditVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    const urgency = getCreditUrgency();
    if (urgency === 'high') return 'destructive';
    if (urgency === 'medium') return 'outline';
    return 'secondary';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url || ''} alt={t('userDropdown.avatar.alt', 'User')} />
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
              <AvatarImage src={profile?.avatar_url || ''} alt={t('userDropdown.avatar.alt', 'User')} />
              <AvatarFallback className="text-sm font-medium">
                {user?.email ? getInitials(user.email) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <p className="text-base font-semibold text-foreground leading-tight">
                {getDisplayName()}
              </p>
              <p className="text-sm text-muted-foreground/80 font-medium mt-0.5">
                {profile?.role || t('userDropdown.role.recruiter', 'Recruiter')}
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
        
        <DropdownMenuSeparator />
        
        {/* Credit Status Section */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Credits</span>
            <CreditDisplay />
          </div>
          
          <div className="space-y-1">
            {balance === 0 && (
              <Badge variant="destructive" className="w-full justify-center text-xs py-1">
                <AlertTriangle className="w-3 h-3 mr-1" />
                No Credits Left
              </Badge>
            )}
            
            {balance > 0 && balance <= 5 && (
              <Badge variant="outline" className="w-full justify-center text-xs py-1">
                <Clock className="w-3 h-3 mr-1" />
                Low Credits
              </Badge>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs py-1 h-6"
              onClick={() => {
                window.open('https://t.me/talentspark_support', '_blank');
              }}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Get More Credits
            </Button>
          </div>
        </div>
        
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