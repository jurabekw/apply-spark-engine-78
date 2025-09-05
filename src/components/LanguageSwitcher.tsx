import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { Flag } from 'lucide-react';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  ];

  // Auto-detect browser language on mount
  useEffect(() => {
    const browserLang = navigator.language.split('-')[0]; // Get language without region
    const supportedLang = ['en', 'ru'].includes(browserLang) ? browserLang : 'ru';
    
    // Only set if no language is stored in localStorage
    if (!localStorage.getItem('i18nextLng')) {
      i18n.changeLanguage(supportedLang);
    }
  }, [i18n]);

  // Get the opposite language to show in the flag
  const getOppositeLanguage = () => {
    const currentLang = i18n.language || 'ru';
    return currentLang === 'en' ? 'ru' : 'en';
  };

  const oppositeLanguage = languages.find(lang => lang.code === getOppositeLanguage());
  const currentLanguage = languages.find(lang => lang.code === i18n.language);

  const toggleLanguage = () => {
    const newLanguage = getOppositeLanguage();
    i18n.changeLanguage(newLanguage);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="relative transition-all hover:scale-105 duration-200 flex items-center gap-2 px-3 py-2 h-9 bg-muted/50 hover:bg-muted border border-border/30"
      title={`Switch to ${oppositeLanguage?.name}`}
    >
      <Flag className="w-3 h-3 text-muted-foreground" />
      <span className="text-base leading-none">{oppositeLanguage?.flag}</span>
      <span className="text-xs text-muted-foreground hidden sm:block">
        {oppositeLanguage?.code.toUpperCase()}
      </span>
    </Button>
  );
};

export default LanguageSwitcher;