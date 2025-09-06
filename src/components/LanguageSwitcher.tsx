import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

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

  const toggleLanguage = () => {
    const newLanguage = getOppositeLanguage();
    i18n.changeLanguage(newLanguage);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      className="relative transition-all hover:scale-110 duration-200 p-2 h-10 w-10"
      title={`Switch to ${oppositeLanguage?.name}`}
    >
      <span className="text-xl leading-none">{oppositeLanguage?.flag}</span>
    </Button>
  );
};

export default LanguageSwitcher;