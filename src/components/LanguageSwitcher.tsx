import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';

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

  const currentLanguage = languages.find(lang => lang.code === (i18n.language || 'ru'));

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="group relative min-w-[100px] h-9 px-3 py-1.5 
                     bg-gradient-to-r from-primary/5 to-secondary/5 
                     border-primary/20 hover:border-primary/40 
                     hover:from-primary/10 hover:to-secondary/10
                     transition-all duration-300 ease-out
                     hover:shadow-md hover:shadow-primary/10
                     focus:ring-2 focus:ring-primary/20 focus:ring-offset-1"
        >
          <Globe className="w-3.5 h-3.5 text-primary mr-2 transition-transform group-hover:rotate-12" />
          <span className="text-sm font-medium text-foreground mr-1">
            {currentLanguage?.code === 'en' ? 'EN' : 'Русский'}
          </span>
          <ChevronDown className="w-3 h-3 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-44 p-1 bg-background/95 backdrop-blur-sm border border-border/50 shadow-lg"
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer
              transition-all duration-200 ease-out
              ${currentLanguage?.code === lang.code 
                ? 'bg-primary/10 text-primary font-medium' 
                : 'text-foreground'
              }
            `}
          >
            <span className="text-sm flex-1">
              {lang.name} — {lang.code.toUpperCase()}
            </span>
            {currentLanguage?.code === lang.code && (
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;