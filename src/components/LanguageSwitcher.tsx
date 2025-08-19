import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { useLanguage, type Language } from '@/contexts/LanguageContext';

const languages = {
  en: {
    flag: '🇺🇸',
    name: 'English',
    shortName: 'EN'
  },
  ru: {
    flag: '🇷🇺', 
    name: 'Русский',
    shortName: 'RU'
  }
};

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();
  const currentLang = languages[language];

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-3">
          <span className="text-lg">{currentLang.flag}</span>
          <span className="hidden sm:inline text-sm font-medium">{currentLang.shortName}</span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-background border border-border shadow-lg">
        {Object.entries(languages).map(([code, lang]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => handleLanguageChange(code as Language)}
            className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted ${
              language === code ? 'bg-muted/50' : ''
            }`}
          >
            <span className="text-lg">{lang.flag}</span>
            <span className="font-medium">{lang.name}</span>
            {language === code && (
              <div className="ml-auto w-2 h-2 bg-primary rounded-full"></div>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;