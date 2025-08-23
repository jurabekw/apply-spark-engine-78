import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      
      if (!token || type !== 'signup') {
        setStatus('error');
        setMessage('Invalid confirmation link');
        return;
      }

      try {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          setStatus('success');
          setMessage('Email confirmed successfully! You can now sign in.');
          
          toast({
            title: "Email Confirmed",
            description: "Your account has been verified. You can now sign in.",
          });

          // Redirect to sign in after 3 seconds
          setTimeout(() => {
            navigate('/auth?tab=signin');
          }, 3000);
        }
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
  }, [searchParams, navigate, toast]);

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
              {status === 'loading' && 'Confirming your email...'}
              {status === 'success' && 'Email Confirmed!'}
              {status === 'error' && 'Confirmation Failed'}
            </CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
          <CardContent>
            {status === 'success' && (
              <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                onClick={() => navigate('/auth?tab=signin')}
              >
                Go to Sign In
              </Button>
            )}
            {status === 'error' && (
              <div className="space-y-2">
                <Button 
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => navigate('/auth?tab=signup')}
                >
                  Try Sign Up Again
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/auth?tab=signin')}
                >
                  Go to Sign In
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