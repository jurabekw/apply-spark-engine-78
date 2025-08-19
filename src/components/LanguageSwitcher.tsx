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
        <Button variant="ghost" className="flex items-center gap-2 px-3 h-9 hover:bg-muted">
          <span className="text-base leading-none select-none">{currentLang.flag}</span>
          <span className="text-sm font-medium text-foreground hidden sm:inline">{currentLang.shortName}</span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 bg-popover border border-border shadow-lg z-[60]">
        {Object.entries(languages).map(([code, lang]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => handleLanguageChange(code as Language)}
            className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-accent focus:bg-accent ${
              language === code ? 'bg-accent/50' : ''
            }`}
          >
            <span className="text-base leading-none select-none">{lang.flag}</span>
            <span className="font-medium text-foreground flex-1">{lang.name}</span>
            {language === code && (
              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;