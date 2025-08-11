import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, User, Bell, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
const Header = () => {
  const {
    user,
    signOut
  } = useAuth();
  const handleSignOut = async () => {
    await signOut();
  };
  return <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">HR</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">TalentSpark</h1>
            <p className="text-xs text-gray-500">AI-Powered Recruitment</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          

          <Link to="/resume-search" className="hidden md:block">
            
          </Link>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <User className="w-4 h-4" />
              {user?.email?.split('@')[0] || 'HR Admin'}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>;
};
export default Header;