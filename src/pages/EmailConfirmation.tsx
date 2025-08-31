import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const EmailConfirmation = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Check for error in URL hash first
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');
        
        if (error) {
          setStatus('error');
          setMessage(errorDescription || 'Email confirmation failed');
          
          toast({
            title: t('toasts.confirmationFailed'),
            description: errorDescription || t('errors.failedToConfirm'),
            variant: "destructive",
          });
          return;
        }

        // Set up auth state listener to detect successful confirmation
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            setStatus('success');
            setMessage('Email confirmed successfully! You can now sign in.');
            
            toast({
              title: "Email Confirmed",
              description: "Your account has been verified. You can now sign in.",
            });

            // Redirect to dashboard after 3 seconds
            setTimeout(() => {
              navigate('/dashboard');
            }, 3000);
          } else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
            // Check if there's a user session after token refresh
            const checkSession = async () => {
              const { data: { session } } = await supabase.auth.getSession();
              if (session?.user) {
                setStatus('success');
                setMessage('Email confirmed successfully! You can now sign in.');
                
                toast({
                  title: "Email Confirmed",
                  description: "Your account has been verified. You can now sign in.",
                });

                setTimeout(() => {
                  navigate('/dashboard');
                }, 3000);
              }
            };
            checkSession();
          }
        });

        // Check for existing session (in case user is already authenticated)
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setStatus('success');
          setMessage('Email confirmed successfully! You can now sign in.');
          
          toast({
            title: "Email Confirmed",
            description: "Your account has been verified. You can now sign in.",
          });

          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        } else {
          // If no session and no error, wait a moment for Supabase to process the URL
          setTimeout(() => {
            // If still loading after 5 seconds, show error
            if (status === 'loading') {
              setStatus('error');
              setMessage('Email confirmation timed out. Please try again.');
            }
          }, 5000);
        }

        // Cleanup subscription
        return () => {
          subscription.unsubscribe();
        };
      } catch (error: any) {
        console.error('Email confirmation error:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to confirm email');
        
        toast({
          title: "Confirmation Failed",
          description: error.message || "Failed to confirm email",
          variant: "destructive",
        });
      }
    };

    handleEmailConfirmation();
  }, [navigate, toast, status]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4">
              {status === 'loading' && (
                <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
              )}
              {status === 'success' && (
                <CheckCircle className="w-8 h-8 text-green-600" />
              )}
              {status === 'error' && (
                <XCircle className="w-8 h-8 text-red-600" />
              )}
            </div>
            <CardTitle>
              {status === 'loading' && t('errors.confirmingEmail')}
              {status === 'success' && t('errors.emailConfirmed')}
              {status === 'error' && t('errors.confirmationFailed')}
            </CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
          <CardContent>
            {status === 'success' && (
              <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                onClick={() => navigate('/auth?tab=signin')}
              >
                {t('auth.signIn')}
              </Button>
            )}
            {status === 'error' && (
              <div className="space-y-2">
                <Button 
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => navigate('/auth?tab=signup')}
                >
                  {t('auth.signUp')}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/auth?tab=signin')}
                >
                  {t('auth.signIn')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailConfirmation;