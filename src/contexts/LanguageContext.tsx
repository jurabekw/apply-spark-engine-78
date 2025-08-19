import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ru';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Detect user's country for default language
const detectDefaultLanguage = (): Language => {
  try {
    // Check localStorage first
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang) return savedLang;
    
    // Check timezone for Uzbekistan
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone.includes('Tashkent') || timezone.includes('Samarkand')) {
      return 'ru';
    }
    
    // Check browser language
    const browserLang = navigator.language.split('-')[0];
    return browserLang === 'ru' ? 'ru' : 'en';
  } catch {
    return 'en'; // fallback
  }
};

const translations = {
  en: {
    // Header
    'header.search.placeholder': 'Search candidates...',
    'header.user.role': 'Recruiter',
    'header.signout': 'Sign Out',
    
    // Landing Page
    'landing.hero.badge': '🚀 Trusted by 1000+ HR teams worldwide',
    'landing.hero.title': 'Find Perfect Candidates',
    'landing.hero.subtitle': '10x Faster',
    'landing.hero.description': 'Revolutionary AI-powered recruitment platform combining resume analysis with intelligent candidate search across millions of profiles. Find, screen, and hire the perfect talent in minutes, not months.',
    'landing.hero.cta': 'Start Free Trial',
    'landing.hero.no-card': 'No credit card required • 14-day free trial • Cancel anytime',
    'landing.search.badge': 'New Feature',
    'landing.search.title': 'Intelligent Candidate Search',
    'landing.search.description': 'Access millions of candidate profiles with AI-powered search. Find passive candidates, niche specialists, and perfect cultural fits that traditional methods miss.',
    'landing.search.cta': 'Try Search Feature',
    'landing.features.title': 'Powerful Features for Modern Hiring',
    'landing.features.description': 'Everything you need to revolutionize your recruitment process and find exceptional talent',
    'landing.why.title': 'Why Choose TalentSpark?',
    'landing.why.description': 'Join thousands of companies that have revolutionized their hiring process and discovered top talent they never knew existed.',
    'landing.why.cta': 'Get Started Today',
    'landing.testimonials.title': 'Loved by HR Teams Worldwide',
    'landing.testimonials.description': 'See how TalentSpark is transforming recruitment for leading companies',
    'landing.cta.title': 'Ready to Transform Your Hiring?',
    'landing.cta.description': 'Join thousands of HR professionals who have revolutionized their recruitment process and discovered top talent with TalentSpark\'s AI-powered platform.',
    'landing.cta.button': 'Start Your Free Trial',
    'landing.auth.signin': 'Sign In',
    'landing.auth.signup': 'Get Started Free',
    
    // Dashboard
    'dashboard.welcome': 'Welcome Back',
    'dashboard.description': 'Your AI-powered recruitment dashboard • {date}',
    'dashboard.status.online': 'Online',
    'dashboard.tabs.dashboard': 'Dashboard',
    'dashboard.tabs.upload': 'Upload Resumes',
    'dashboard.tabs.hh-search': 'HH Candidate Search',
    'dashboard.tabs.linkedin-search': 'LinkedIn Search',
    'dashboard.tabs.candidates': 'Candidates',
    'dashboard.tabs.forms': 'Application Forms',
    'dashboard.quick-upload.title': 'Quick Upload',
    'dashboard.quick-upload.description': 'Upload multiple resumes and get instant AI analysis with detailed scoring',
    'dashboard.quick-upload.button': 'Start Screening Process',
    'dashboard.hh-search.title': 'HH Search',
    'dashboard.hh-search.description': 'Search external candidate databases with AI-powered matching',
    'dashboard.hh-search.button': 'Search Candidates',
    'dashboard.recent-searches.title': 'Recent HH Searches',
    'dashboard.recent-searches.view-all': 'View all',
    'dashboard.recent-searches.empty': 'No searches yet',
    'dashboard.recent-searches.found': 'found',
    'dashboard.recent-uploads.title': 'Recent Uploads',
    'dashboard.recent-uploads.view-all': 'View all',
    'dashboard.recent-uploads.empty': 'No uploads yet',
    'dashboard.recent-uploads.match': 'match',
    'dashboard.loading': 'Loading your dashboard...',
    'dashboard.forms.title': 'Form Builder Coming Soon',
    'dashboard.forms.description': 'Create custom application forms with our drag-and-drop builder',
    'dashboard.forms.button': 'Create New Form',
    
    // Features
    'features.ai-analysis.title': 'AI-Powered Resume Analysis',
    'features.ai-analysis.description': 'Advanced AI algorithms analyze resumes in seconds, extracting key skills, experience, and qualifications with 98% accuracy.',
    'features.search.title': 'Intelligent Candidate Search',
    'features.search.description': 'Find perfect candidates from your database or external sources using natural language queries and smart filtering.',
    'features.database.title': 'Comprehensive Database Search',
    'features.database.description': 'Search through millions of candidate profiles from leading job boards and professional networks instantly.',
    'features.screening.title': 'Lightning-Fast Screening',
    'features.screening.description': 'Process hundreds of resumes in minutes, not days. Get instant insights, rankings, and match scores.',
    'features.bias-free.title': 'Bias-Free Hiring',
    'features.bias-free.description': 'Eliminate unconscious bias with objective, data-driven candidate evaluation and fair assessment algorithms.',
    'features.matching.title': 'Perfect Job Matching',
    'features.matching.description': 'Find ideal candidates using our proprietary skill-matching algorithm and cultural fit assessment.',
    
    // Search Features
    'search.smart-query.title': 'Smart Query Search',
    'search.smart-query.description': 'Use natural language to find candidates: \'Senior React developer with 5+ years in fintech\'',
    'search.filtering.title': 'Advanced Filtering',
    'search.filtering.description': 'Filter by location, salary, experience, skills, education, and 50+ other criteria',
    'search.multi-source.title': 'Multi-Source Access',
    'search.multi-source.description': 'Search across LinkedIn, Indeed, Stack Overflow, GitHub, and 20+ other platforms',
    'search.ai-recommendations.title': 'AI Recommendations',
    'search.ai-recommendations.description': 'Get AI-suggested candidates based on your hiring patterns and success metrics',
    
    // Benefits
    'benefits.time': 'Reduce hiring time by up to 80%',
    'benefits.profiles': 'Access millions of candidate profiles',
    'benefits.bias': 'Eliminate unconscious bias in recruitment',
    'benefits.efficiency': 'Process 10x more applications efficiently',
    'benefits.quality': 'Improve candidate quality with AI insights',
    'benefits.workflow': 'Streamline your entire hiring workflow',
    'benefits.decisions': 'Make data-driven hiring decisions',
    
    // Stats
    'stats.faster': 'Faster Hiring',
    'stats.accuracy': 'Match Accuracy',
    'stats.companies': 'Companies',
    'stats.profiles': 'Profiles Searched',
    'stats.total-candidates': 'Total Candidates',
    'stats.active-positions': 'Active Positions',
    'stats.average-ai-score': 'Average AI Score',
    'stats.this-week': 'This Week',
    'stats.all-candidates': 'All candidates in database',
    'stats.currently-open': 'Currently open positions',
    'stats.candidate-match': 'Candidate match quality',
    'stats.new-candidates': 'New candidates added',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.import': 'Import',
  },
  ru: {
    // Header
    'header.search.placeholder': 'Поиск кандидатов...',
    'header.user.role': 'Рекрутер',
    'header.signout': 'Выйти',
    
    // Landing Page
    'landing.hero.badge': '🚀 Нам доверяют более 1000 HR-команд по всему миру',
    'landing.hero.title': 'Найдите идеальных кандидатов',
    'landing.hero.subtitle': 'В 10 раз быстрее',
    'landing.hero.description': 'Революционная платформа для рекрутинга на базе ИИ, объединяющая анализ резюме с интеллектуальным поиском кандидатов среди миллионов профилей. Находите, отбирайте и нанимайте идеальных специалистов за минуты, а не месяцы.',
    'landing.hero.cta': 'Начать бесплатный период',
    'landing.hero.no-card': 'Кредитная карта не требуется • 14-дневная бесплатная пробная версия • Отмена в любое время',
    'landing.search.badge': 'Новая функция',
    'landing.search.title': 'Интеллектуальный поиск кандидатов',
    'landing.search.description': 'Получите доступ к миллионам профилей кандидатов с помощью поиска на базе ИИ. Найдите пассивных кандидатов, узких специалистов и идеальных соответствий культуре, которых традиционные методы упускают.',
    'landing.search.cta': 'Попробовать функцию поиска',
    'landing.features.title': 'Мощные функции для современного найма',
    'landing.features.description': 'Все, что нужно для революции в процессе рекрутинга и поиска исключительных талантов',
    'landing.why.title': 'Почему выбирают TalentSpark?',
    'landing.why.description': 'Присоединяйтесь к тысячам компаний, которые революционизировали свой процесс найма и открыли для себя топ-таланты, о существовании которых они не знали.',
    'landing.why.cta': 'Начать сегодня',
    'landing.testimonials.title': 'Любимы HR-командами по всему миру',
    'landing.testimonials.description': 'Посмотрите, как TalentSpark трансформирует рекрутинг для ведущих компаний',
    'landing.cta.title': 'Готовы трансформировать ваш найм?',
    'landing.cta.description': 'Присоединяйтесь к тысячам HR-профессионалов, которые революционизировали свой процесс рекрутинга и открыли топ-таланты с помощью платформы TalentSpark на базе ИИ.',
    'landing.cta.button': 'Начать бесплатный период',
    'landing.auth.signin': 'Войти',
    'landing.auth.signup': 'Начать бесплатно',
    
    // Dashboard
    'dashboard.welcome': 'Добро пожаловать!',
    'dashboard.description': 'Ваша панель рекрутинга на базе ИИ • {date}',
    'dashboard.status.online': 'Онлайн',
    'dashboard.tabs.dashboard': 'Панель',
    'dashboard.tabs.upload': 'Загрузка резюме',
    'dashboard.tabs.hh-search': 'Поиск кандидатов HH',
    'dashboard.tabs.linkedin-search': 'Поиск LinkedIn',
    'dashboard.tabs.candidates': 'Кандидаты',
    'dashboard.tabs.forms': 'Формы заявок',
    'dashboard.quick-upload.title': 'Быстрая загрузка',
    'dashboard.quick-upload.description': 'Загрузите несколько резюме и получите мгновенный анализ ИИ с подробной оценкой',
    'dashboard.quick-upload.button': 'Начать процесс отбора',
    'dashboard.hh-search.title': 'Поиск HH',
    'dashboard.hh-search.description': 'Поиск по внешним базам кандидатов с помощью ИИ-сопоставления',
    'dashboard.hh-search.button': 'Искать кандидатов',
    'dashboard.recent-searches.title': 'Недавние поиски HH',
    'dashboard.recent-searches.view-all': 'Посмотреть все',
    'dashboard.recent-searches.empty': 'Поисков пока нет',
    'dashboard.recent-searches.found': 'найдено',
    'dashboard.recent-uploads.title': 'Недавние загрузки',
    'dashboard.recent-uploads.view-all': 'Посмотреть все',
    'dashboard.recent-uploads.empty': 'Загрузок пока нет',
    'dashboard.recent-uploads.match': 'совпадение',
    'dashboard.loading': 'Загрузка вашей панели...',
    'dashboard.forms.title': 'Конструктор форм скоро',
    'dashboard.forms.description': 'Создавайте пользовательские формы заявок с помощью нашего конструктора перетаскивания',
    'dashboard.forms.button': 'Создать новую форму',
    
    // Features
    'features.ai-analysis.title': 'Анализ резюме на базе ИИ',
    'features.ai-analysis.description': 'Продвинутые алгоритмы ИИ анализируют резюме за секунды, извлекая ключевые навыки, опыт и квалификацию с точностью 98%.',
    'features.search.title': 'Интеллектуальный поиск кандидатов',
    'features.search.description': 'Найдите идеальных кандидатов из вашей базы данных или внешних источников, используя запросы на естественном языке и умную фильтрацию.',
    'features.database.title': 'Комплексный поиск по базе данных',
    'features.database.description': 'Мгновенно ищите среди миллионов профилей кандидатов с ведущих досок объявлений и профессиональных сетей.',
    'features.screening.title': 'Молниеносный отбор',
    'features.screening.description': 'Обрабатывайте сотни резюме за минуты, а не дни. Получайте мгновенные инсайты, рейтинги и оценки соответствия.',
    'features.bias-free.title': 'Найм без предвзятости',
    'features.bias-free.description': 'Устраните бессознательную предвзятость с помощью объективной, основанной на данных оценки кандидатов и справедливых алгоритмов оценки.',
    'features.matching.title': 'Идеальное сопоставление вакансий',
    'features.matching.description': 'Найдите идеальных кандидатов, используя наш собственный алгоритм сопоставления навыков и оценку культурного соответствия.',
    
    // Search Features
    'search.smart-query.title': 'Умный поиск по запросу',
    'search.smart-query.description': 'Используйте естественный язык для поиска кандидатов: \'Старший React разработчик с опытом 5+ лет в финтехе\'',
    'search.filtering.title': 'Расширенная фильтрация',
    'search.filtering.description': 'Фильтруйте по местоположению, зарплате, опыту, навыкам, образованию и 50+ другим критериям',
    'search.multi-source.title': 'Доступ к множественным источникам',
    'search.multi-source.description': 'Поиск в LinkedIn, Indeed, Stack Overflow, GitHub и 20+ других платформах',
    'search.ai-recommendations.title': 'ИИ рекомендации',
    'search.ai-recommendations.description': 'Получайте предложения кандидатов от ИИ на основе ваших паттернов найма и метрик успеха',
    
    // Benefits
    'benefits.time': 'Сократите время найма до 80%',
    'benefits.profiles': 'Доступ к миллионам профилей кандидатов',
    'benefits.bias': 'Устраните бессознательную предвзятость в рекрутинге',
    'benefits.efficiency': 'Обрабатывайте в 10 раз больше заявок эффективно',
    'benefits.quality': 'Улучшите качество кандидатов с помощью инсайтов ИИ',
    'benefits.workflow': 'Оптимизируйте весь рабочий процесс найма',
    'benefits.decisions': 'Принимайте решения о найме на основе данных',
    
    // Stats
    'stats.faster': 'Быстрее найм',
    'stats.accuracy': 'Точность совпадений',
    'stats.companies': 'Компаний',
    'stats.profiles': 'Профилей найдено',
    'stats.total-candidates': 'Всего кандидатов',
    'stats.active-positions': 'Активные позиции',
    'stats.average-ai-score': 'Средний балл ИИ',
    'stats.this-week': 'На этой неделе',
    'stats.all-candidates': 'Все кандидаты в базе данных',
    'stats.currently-open': 'В настоящее время открытые позиции',
    'stats.candidate-match': 'Качество соответствия кандидатов',
    'stats.new-candidates': 'Новые кандидаты добавлены',
    
    // Common
    'common.loading': 'Загрузка...',
    'common.error': 'Ошибка',
    'common.success': 'Успех',
    'common.cancel': 'Отмена',
    'common.save': 'Сохранить',
    'common.delete': 'Удалить',
    'common.edit': 'Редактировать',
    'common.view': 'Просмотр',
    'common.search': 'Поиск',
    'common.filter': 'Фильтр',
    'common.export': 'Экспорт',
    'common.import': 'Импорт',
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return detectDefaultLanguage();
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        console.log(`Translation missing for key: ${key} in language: ${language}`);
        return key; // Return key if translation not found
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};