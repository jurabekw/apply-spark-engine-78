
import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isRecoverySession: boolean;
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
  const [isRecoverySession, setIsRecoverySession] = useState(false);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        // Check if this is a recovery session
        const isRecovery = event === 'PASSWORD_RECOVERY' || 
          (session?.user?.app_metadata?.provider === 'recovery') ||
          window.location.search.includes('type=recovery');
        
        setIsRecoverySession(isRecovery);
        
        if (event === 'PASSWORD_RECOVERY' && session) {
          setSession(session);
          setUser(session.user);
          setLoading(false);
          
          // Redirect to password reset form
          window.location.href = '/auth?mode=password-reset';
        } else if (event === 'SIGNED_IN' && session) {
          setSession(session);
          setUser(session.user);
          setLoading(false);
          
          // Check if this is a password recovery session or reset mode
          const urlParams = new URLSearchParams(window.location.search);
          const mode = urlParams.get('mode');
          
          // Don't redirect to dashboard if we're in password reset mode or recovery session
          if (mode !== 'reset' && mode !== 'password-reset' && !isRecovery) {
            // Redirect to dashboard after successful sign-in
            setTimeout(() => {
              if (window.location.pathname === '/auth' || window.location.pathname === '/') {
                window.location.href = '/dashboard';
              }
            }, 100);
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setIsRecoverySession(false);
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

    return () => subscription.unsubscribe();
  }, []);

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
      
      // Force page reload for clean state
      window.location.href = '/auth';
    } catch (error) {
      console.error('Sign out error:', error);
      // Force reload even if sign out fails
      window.location.href = '/auth';
    }
  };

  const value = {
    user,
    session,
    loading,
    isRecoverySession,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
