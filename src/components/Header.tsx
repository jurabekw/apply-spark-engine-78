import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, User, Bell, LogOut, Search, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import Logo from './Logo';
import LanguageSwitcher from './LanguageSwitcher';
import { NotificationsDropdown } from './NotificationsDropdown';
import { UserDropdown } from './UserDropdown';
import { SettingsSheet } from './SettingsSheet';
import { TrialStatusBanner } from './TrialStatusBanner';

const Header = () => {
  const { user, signOut } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { hasActiveTrial, timeRemaining, hoursRemaining } = useTrialStatus();
  
  // Determine trial urgency level for color coding
  const getTrialUrgency = (): 'low' | 'medium' | 'high' => {
    if (hoursRemaining > 48) return 'low';    // Green: More than 2 days
    if (hoursRemaining > 24) return 'medium'; // Yellow: 1-2 days
    return 'high';                            // Red: Less than 1 day
  };

  const urgency = getTrialUrgency();

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
  
  const handleSignOut = async () => {
    await signOut();
  };

  const handleGlobalSearch = () => {
    if (searchQuery.trim()) {
      // Navigate to dashboard with search query parameter
      const searchParams = new URLSearchParams();
      searchParams.set('search', searchQuery.trim());
      
      if (location.pathname === '/dashboard') {
        // If already on dashboard, trigger search by updating URL
        navigate(`/dashboard?${searchParams.toString()}`, { replace: true });
        // Trigger custom event to notify dashboard to update search
        window.dispatchEvent(new CustomEvent('global-search', { 
          detail: { query: searchQuery.trim() } 
        }));
      } else {
        // Navigate to dashboard with search parameter
        navigate(`/dashboard?${searchParams.toString()}`);
      }
      
      setSearchQuery(''); // Clear search after performing search
    }
  };

  return (
    <header className="bg-card border-b border-border/50 shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <Link to="/dashboard" className="hover-lift">
            <Logo size="md" variant="light" />
          </Link>

          {/* Center Search - Desktop Only */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder={t('header.searchCandidates')}
                className="pl-10 bg-muted/50 border-none focus:bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleGlobalSearch();
                  }
                }}
              />
            </div>
          </div>


          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Mobile Search Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={handleGlobalSearch}
              disabled={!searchQuery.trim()}
            >
              <Search className="w-4 h-4" />
            </Button>
            
            {/* Notifications */}
            <NotificationsDropdown />
            
            {/* Language Switcher */}
            <LanguageSwitcher />
            
            {/* Settings */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="w-4 h-4" />
            </Button>
            
            {/* User Menu */}
            <div className="flex items-center gap-3 pl-3 border-l border-border/50">
              <UserDropdown onSettingsClick={() => setSettingsOpen(true)} />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-destructive lg:hidden"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">{t('common.signOut')}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Trial Status Banner */}
      <TrialStatusBanner />

      {/* Settings Sheet */}
      <SettingsSheet 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen} 
      />
    </header>
  );
};
export default Header;