
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastEventRef = useRef<string>('');

  // Debounced navigation to prevent multiple redirects
  const debouncedNavigate = useCallback((path: string) => {
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }
    navigationTimeoutRef.current = setTimeout(() => {
      if (location.pathname !== path) {
        navigate(path, { replace: true });
      }
    }, 100);
  }, [navigate, location.pathname]);

  useEffect(() => {
    // Handle tab visibility changes to prevent unnecessary auth state re-evaluations
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab became inactive - clear any pending navigation timeouts
        if (navigationTimeoutRef.current) {
          clearTimeout(navigationTimeoutRef.current);
          navigationTimeoutRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        // Prevent duplicate processing of the same event
        const eventKey = `${event}-${session?.user?.id || 'null'}`;
        if (lastEventRef.current === eventKey && event !== 'TOKEN_REFRESHED') {
          return;
        }
        lastEventRef.current = eventKey;
        
        if (event === 'SIGNED_IN' && session) {
          setSession(session);
          setUser(session.user);
          setLoading(false);
          
          // Check if this is a password recovery session
          const urlParams = new URLSearchParams(window.location.search);
          const mode = urlParams.get('mode');
          
          // Only redirect on actual sign-in events, not session restoration
          if (mode !== 'reset' && !document.hidden) {
            if (location.pathname === '/auth' || location.pathname === '/') {
              debouncedNavigate('/dashboard');
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED') {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, [debouncedNavigate, location.pathname]);

  const signOut = async () => {
    try {
      // Clean up auth state
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      // Attempt global sign out
      await supabase.auth.signOut({ scope: 'global' });
      
      // Navigate to auth page instead of hard reload
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Sign out error:', error);
      // Navigate to auth page even if sign out fails
      navigate('/auth', { replace: true });
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
