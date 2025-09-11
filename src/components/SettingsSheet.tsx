import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, User, Globe, Bell, Database } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/ui/use-toast';
import { useTheme } from '@/providers/ThemeProvider';

const profileFormSchema = z.object({
  company: z.string().optional(),
  role: z.string().min(1, 'Role is required'),
  bio: z.string().optional(),
});

const preferencesFormSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  language: z.enum(['en', 'ru']),
  email_notifications: z.boolean(),
});

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsSheet = ({ open, onOpenChange }: SettingsSheetProps) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { profile, updateProfile } = useUserProfile();
  const { preferences, updatePreferences } = useUserPreferences();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'data'>('profile');

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    values: {
      company: profile?.company || '',
      role: profile?.role || 'recruiter',
      bio: profile?.bio || '',
    },
  });

  const preferencesForm = useForm<z.infer<typeof preferencesFormSchema>>({
    resolver: zodResolver(preferencesFormSchema),
    values: {
      theme: preferences?.theme || 'light',
      language: preferences?.language || 'en',
      email_notifications: preferences?.email_notifications ?? true,
    },
  });

  const onProfileSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    try {
      await updateProfile(values);
      toast({
        title: t('settings.profileUpdated', 'Profile updated'),
        description: t('settings.profileUpdatedDesc', 'Your profile has been updated successfully.'),
      });
    } catch (error) {
      toast({
        title: t('common.error', 'Error'),
        description: t('settings.profileUpdateError', 'Failed to update profile.'),
        variant: 'destructive',
      });
    }
  };

  const onPreferencesSubmit = async (values: z.infer<typeof preferencesFormSchema>) => {
    try {
      await updatePreferences(values);
      
      // Update language if changed
      if (values.language !== i18n.language) {
        i18n.changeLanguage(values.language);
      }
      
      toast({
        title: t('settings.preferencesUpdated', 'Preferences updated'),
        description: t('settings.preferencesUpdatedDesc', 'Your preferences have been updated successfully.'),
      });
    } catch (error) {
      toast({
        title: t('common.error', 'Error'),
        description: t('settings.preferencesUpdateError', 'Failed to update preferences.'),
        variant: 'destructive',
      });
    }
  };

  const getInitials = (email: string) => {
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  const TabButton = ({ id, label, icon }: { id: string; label: string; icon: React.ReactNode }) => (
    <Button
      variant={activeTab === id ? 'default' : 'ghost'}
      className="w-full justify-start"
      onClick={() => setActiveTab(id as any)}
    >
      {icon}
      {label}
    </Button>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle>{t('settings.title', 'Settings')}</SheetTitle>
          <SheetDescription>
            {t('settings.description', 'Manage your account settings and preferences.')}
          </SheetDescription>
        </SheetHeader>

        <div className="flex gap-6 mt-6">
          {/* Sidebar */}
          <div className="w-48 space-y-2">
            <TabButton
              id="profile"
              label={t('settings.profile', 'Profile')}
              icon={<User className="mr-2 h-4 w-4" />}
            />
            <TabButton
              id="preferences"
              label={t('settings.preferences', 'Preferences')}
              icon={<Globe className="mr-2 h-4 w-4" />}
            />
            <TabButton
              id="data"
              label={t('settings.data', 'Data')}
              icon={<Database className="mr-2 h-4 w-4" />}
            />
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">{t('settings.profileSettings', 'Profile Settings')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.profileDesc', 'Manage your public profile information.')}
                  </p>
                </div>

                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile?.avatar_url || ''} alt="Profile" />
                    <AvatarFallback className="text-lg">
                      {user?.email ? getInitials(user.email) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            // TODO: Implement avatar upload to Supabase storage
                            toast({
                              title: t('settings.uploadNotImplemented', 'Upload feature coming soon'),
                              description: t('settings.uploadNotImplementedDesc', 'Avatar upload will be available soon.'),
                            });
                          }
                        };
                        input.click();
                      }}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {t('settings.uploadAvatar', 'Upload Avatar')}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('settings.avatarDesc', 'JPG, PNG up to 2MB')}
                    </p>
                  </div>
                </div>

                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                    <FormField
                      control={profileForm.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('settings.company', 'Company')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('settings.companyPlaceholder', 'Enter company name')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('settings.role', 'Role')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('settings.selectRole', 'Select role')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="recruiter">{t('settings.recruiter', 'Recruiter')}</SelectItem>
                              <SelectItem value="hr_manager">{t('settings.hrManager', 'HR Manager')}</SelectItem>
                              <SelectItem value="hiring_manager">{t('settings.hiringManager', 'Hiring Manager')}</SelectItem>
                              <SelectItem value="admin">{t('settings.admin', 'Admin')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('settings.bio', 'Bio')}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t('settings.bioPlaceholder', 'Tell us about yourself')}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit">
                      {t('settings.saveProfile', 'Save Profile')}
                    </Button>
                  </form>
                </Form>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">{t('settings.appPreferences', 'App Preferences')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.preferencesDesc', 'Customize your app experience.')}
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="text-base font-medium">
                      {t('settings.theme', 'Theme')}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('settings.themeDesc', 'Choose your preferred theme.')}
                    </p>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger className="w-48 mt-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">{t('settings.lightMode', 'Light')}</SelectItem>
                        <SelectItem value="dark">{t('settings.darkMode', 'Dark')}</SelectItem>
                        <SelectItem value="system">{t('settings.systemMode', 'System')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="text-base font-medium">
                      {t('settings.language', 'Language')}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('settings.languageDesc', 'Choose your preferred language.')}
                    </p>
                    <Select 
                      value={i18n.language} 
                      onValueChange={(value) => {
                        i18n.changeLanguage(value);
                        updatePreferences({ language: value as 'en' | 'ru' });
                      }}
                    >
                      <SelectTrigger className="w-48 mt-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ru">Русский</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Form {...preferencesForm}>
                  <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)} className="space-y-6">


                    <FormField
                      control={preferencesForm.control}
                      name="email_notifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              {t('settings.emailNotifications', 'Email Notifications')}
                            </FormLabel>
                            <FormDescription>
                              {t('settings.emailNotificationsDesc', 'Receive email notifications about important updates.')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <Button type="submit">
                      {t('settings.savePreferences', 'Save Preferences')}
                    </Button>
                  </form>
                </Form>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">{t('settings.dataSettings', 'Data Settings')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.dataDesc', 'Manage your data and export options.')}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h4 className="font-medium">{t('settings.exportData', 'Export Data')}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('settings.exportDesc', 'Download your data in CSV format.')}
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-3"
                      onClick={() => {
                        // TODO: Implement data export functionality
                        toast({
                          title: t('settings.exportStarted', 'Export started'),
                          description: t('settings.exportInProgress', 'Your data export is being prepared.'),
                        });
                      }}
                    >
                      {t('settings.exportCandidates', 'Export Candidates')}
                    </Button>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};