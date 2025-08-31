import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Mail, Lock, User, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'signin');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');

  // Signup confirmation state
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  // Password recovery state
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  // Password reset state
  const [resetMode, setResetMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Clean up auth state utility
  const cleanupAuthState = () => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  };

  useEffect(() => {
    // Check for password reset mode first
    const mode = searchParams.get('mode');
    
    // Don't redirect to dashboard if we're in password reset mode
    if (user && mode !== 'reset') {
      navigate('/dashboard');
      return;
    }

    // Handle URL parameters for auth errors
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (error) {
      let message = 'Authentication failed';
      if (error === 'access_denied' && errorDescription?.includes('otp_expired')) {
        message = 'Email verification link has expired. Please sign up again to receive a new verification email.';
      } else if (errorDescription) {
        message = errorDescription.replace(/\+/g, ' ');
      }
      
      toast({
        title: t('toasts.authError'),
        description: message,
        variant: "destructive",
      });
      
      // Clean up URL parameters
      navigate('/auth', { replace: true });
    }

    // Check for password reset mode (using existing mode variable)
    if (mode === 'reset') {
      setResetMode(true);
      setActiveTab('signin');
    }

    const tab = searchParams.get('tab');
    if (tab && (tab === 'signin' || tab === 'signup')) {
      setActiveTab(tab);
    }
  }, [searchParams, user, navigate, toast]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Clean up existing state
      cleanupAuthState();
      
      // Attempt global sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: t('toasts.welcomeBack'),
          description: "You have been successfully signed in.",
        });
        // Force page reload for clean state
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      toast({
        title: t('toasts.signInFailed'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Clean up existing state
      cleanupAuthState();
      
      // Check if email already exists
      const { data: existingUser, error: checkError } = await supabase.auth.signInWithPassword({
        email: signupEmail,
        password: 'temporary-check'
      });

      // If we get any response that's not 'Invalid login credentials', the email exists
      if (checkError && !checkError.message.includes('Invalid login credentials')) {
        // Email might exist, but let's be more certain with a signup attempt
      } else if (checkError?.message.includes('Invalid login credentials')) {
        // Email exists but password is wrong - user should sign in
        toast({
          title: t('toasts.accountExists'),
          description: "An account with this email already exists. Please sign in instead.",
          variant: "destructive",
        });
        setLoginEmail(signupEmail);
        setActiveTab('signin');
        setLoading(false);
        return;
      }
      
      // Use the correct domain for email confirmation
      const redirectUrl = `https://talentspark.uz/confirm`;
      
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            company: company,
          }
        }
      });

      if (error) {
        // Check if error indicates user already exists
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          toast({
            title: "Account already exists",
            description: "An account with this email already exists. Please sign in instead.",
            variant: "destructive",
          });
          setLoginEmail(signupEmail);
          setActiveTab('signin');
          return;
        }
        throw error;
      }

      if (data.user) {
        setVerificationEmail(signupEmail);
        setVerificationSent(true);
        toast({
          title: "Check your email!",
          description: "We've sent you a verification link to complete your registration.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `https://talentspark.uz/auth?mode=reset`,
      });

      if (error) throw error;

      setResetEmailSent(true);
      toast({
        title: "Password reset email sent",
        description: "Check your email for instructions to reset your password.",
      });
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Password updated successfully",
        description: "Your password has been reset. You can now sign in with your new password.",
      });

      // Reset state and redirect to sign in
      setResetMode(false);
      setNewPassword('');
      setConfirmPassword('');
      navigate('/auth?tab=signin', { replace: true });
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center cursor-pointer" onClick={() => navigate('/')}>
              <span className="text-white font-bold text-lg">HR</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">TalentSpark</h2>
          <p className="text-gray-600 mt-2">AI-Powered HR Recruitment Platform</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Get Started</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">{t('auth.signIn')}</TabsTrigger>
                <TabsTrigger value="signup">{t('auth.signUp')}</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4 mt-6">
                {resetMode ? (
                  <div className="space-y-4">
                    <form onSubmit={handlePasswordReset} className="space-y-4">
                      <div className="text-center space-y-2">
                        <h3 className="text-xl font-semibold">Set new password</h3>
                        <p className="text-muted-foreground">
                          Enter your new password below.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="new-password"
                            type="password"
                            placeholder={t('auth.enterNewPassword')}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="pl-10"
                            required
                            minLength={6}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="confirm-password"
                            type="password"
                            placeholder={t('auth.confirmNewPassword')}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="pl-10"
                            required
                            minLength={6}
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700"
                        disabled={loading}
                      >
                        {loading ? 'Updating Password...' : 'Update Password'}
                      </Button>
                    </form>
                  </div>
                ) : forgotPasswordMode ? (
                  <div className="space-y-4">
                    {resetEmailSent ? (
                      <div className="space-y-4 text-center">
                        <div className="mx-auto w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center">
                          <Mail className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold">Check your email</h3>
                        <p className="text-muted-foreground">
                          We sent a password reset link to {resetEmail}. Please open your inbox and follow the link to reset your password.
                        </p>
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={() => {
                            setForgotPasswordMode(false);
                            setResetEmailSent(false);
                            setResetEmail('');
                          }}
                        >
                          Back to Sign In
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div className="text-center space-y-2">
                          <h3 className="text-xl font-semibold">Reset your password</h3>
                          <p className="text-muted-foreground">
                            Enter your email address and we'll send you a link to reset your password.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reset-email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="reset-email"
                              type="email"
                              placeholder={t('auth.enterEmail')}
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>
                        <Button
                          type="submit"
                          className="w-full bg-indigo-600 hover:bg-indigo-700"
                          disabled={loading}
                        >
                          {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
                        </Button>
                        <Button 
                          variant="outline" 
                          type="button"
                          className="w-full" 
                          onClick={() => setForgotPasswordMode(false)}
                        >
                          Back to Sign In
                        </Button>
                      </form>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">{t('auth.email')}</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder={t('auth.enterEmail')}
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">{t('auth.password')}</Label>
                        <Button
                          variant="link"
                          type="button"
                          className="h-auto p-0 text-sm text-indigo-600 hover:text-indigo-700"
                          onClick={() => setForgotPasswordMode(true)}
                        >
                          {t('auth.forgotPassword')}
                        </Button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="login-password"
                          type="password"
                          placeholder={t('auth.enterPassword')}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                      disabled={loading}
                    >
                      {loading ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </form>
                )}
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 mt-6">
                {verificationSent ? (
                  <div className="space-y-4 text-center">
                    <div className="mx-auto w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold">Check your email</h3>
                    <p className="text-muted-foreground">
                      We sent a verification link to {verificationEmail}. Please open your inbox and follow the link to finish signing up.
                    </p>
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={() => setActiveTab('signin')}>
                      Go to Sign In
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="full-name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="full-name"
                          type="text"
                          placeholder="Enter your full name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="company"
                          type="text"
                          placeholder="Enter your company name"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder={t('auth.enterEmail')}
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Create a password"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          className="pl-10"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                      disabled={loading}
                    >
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-600">
          By signing up, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  );
};

export default Auth;
