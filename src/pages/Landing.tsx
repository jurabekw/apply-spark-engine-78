import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Users, FileText, BarChart3, CheckCircle, Star, Zap, Shield, Clock, Brain, Target, TrendingUp, Search, Database, Filter, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from '@/components/Logo';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const Landing = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const features = [
    {
      icon: Brain,
      title: t('landing.features.aiPoweredAnalysis'),
      description: t('landing.features.aiPoweredDescription')
    },
    {
      icon: Search,
      title: t('landing.features.intelligentSearch'),
      description: t('landing.features.intelligentSearchDescription')
    },
    {
      icon: Database,
      title: t('landing.features.comprehensiveDatabase'),
      description: t('landing.features.comprehensiveDatabaseDescription')
    },
    {
      icon: Zap,
      title: t('landing.features.lightningFast'),
      description: t('landing.features.lightningFastDescription')
    },
    {
      icon: Shield,
      title: t('landing.features.biasFree'),
      description: t('landing.features.biasFreeDescription')
    },
    {
      icon: Target,
      title: t('landing.features.perfectMatching'),
      description: t('landing.features.perfectMatchingDescription')
    }
  ];

  const benefits = [
    t('landing.benefits.reduceTime'),
    t('landing.benefits.accessProfiles'),
    t('landing.benefits.eliminateBias'),
    t('landing.benefits.processMore'),
    t('landing.benefits.improveQuality'),
    t('landing.benefits.streamlineWorkflow'),
    t('landing.benefits.dataDriven')
  ];

  const testimonials = [
    {
      name: "Алёна Смирнова",
      role: t('landing.testimonials.role1'),
      content: t('landing.testimonials.testimonial1'),
      rating: 5
    },
    {
      name: "Дилшод Ахмедов", 
      role: t('landing.testimonials.role2'),
      content: t('landing.testimonials.testimonial2'),
      rating: 5
    },
    {
      name: "Анна Петрова",
      role: t('landing.testimonials.role3'),
      content: t('landing.testimonials.testimonial3'),
      rating: 5
    }
  ];

  const searchFeatures = [
    {
      icon: Search,
      title: t('landing.searchFeatures.smartQuery'),
      description: t('landing.searchFeatures.smartQueryDescription')
    },
    {
      icon: Filter,
      title: t('landing.searchFeatures.advancedFiltering'),
      description: t('landing.searchFeatures.advancedFilteringDescription')
    },
    {
      icon: Database,
      title: t('landing.searchFeatures.multiSource'),
      description: t('landing.searchFeatures.multiSourceDescription')
    },
    {
      icon: Sparkles,
      title: t('landing.searchFeatures.aiRecommendations'),
      description: t('landing.searchFeatures.aiRecommendationsDescription')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/50 to-primary/5">
      {/* Header */}
      <header className="bg-surface/80 backdrop-blur-sm shadow-subtle border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Logo size="md" variant="light" />

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Button variant="ghost" onClick={() => navigate('/auth?tab=signin')}>
              {t('auth.signIn')}
            </Button>
            <Button className="bg-gradient-to-r from-primary to-accent hover:shadow-glow" onClick={() => navigate('/auth?tab=signup')}>
              {t('landing.getStarted')}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-violet-600 to-purple-700 text-white py-24">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-8 px-6 py-3 text-sm bg-white/10 text-white border-white/20">
            ⭐ {t('landing.trustedByTeams')}
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-heading font-bold mb-8 leading-tight">
            {t('landing.hero.title')}
          </h1>
          
          <p className="text-xl md:text-2xl mb-12 max-w-4xl mx-auto leading-relaxed text-white/90">
            {t('landing.hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <Button 
              size="lg" 
              className="bg-teal-500 hover:bg-teal-400 text-white px-12 py-6 text-lg font-bold rounded-xl shadow-2xl hover:shadow-teal-500/25 transform hover:scale-105 transition-all"
              onClick={() => navigate('/auth?tab=signup')}
            >
              👉 {t('landing.hero.cta')}
            </Button>
          </div>

          <p className="text-sm text-white/80">
            {t('landing.hero.noCreditCard')}
          </p>

          {/* Client Logos Placeholder */}
          <div className="mt-12 flex items-center justify-center gap-8 opacity-60">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">in</span>
              </div>
              <span className="text-white font-medium">LinkedIn</span>
            </div>
            
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">HH</span>
              </div>
              <span className="text-white font-medium">HeadHunter</span>
            </div>
            
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4">
              <Upload className="w-8 h-8 text-white" />
              <span className="text-white font-medium">{t('landing.bulkResumeUpload')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Value Proposition */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-6">
            {t('landing.valueProposition.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
            {t('landing.valueProposition.subtitle')}
          </p>

          {/* 3-Step Visual Process */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-12">
            <div className="flex flex-col items-center text-center max-w-xs">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <Search className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">{t('landing.valueProposition.step1')}</h3>
              <p className="text-muted-foreground text-sm">{t('landing.valueProposition.step1Description')}</p>
            </div>
            
            <div className="hidden md:block text-4xl text-muted-foreground">→</div>
            
            <div className="flex flex-col items-center text-center max-w-xs">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <Filter className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">{t('landing.valueProposition.step2')}</h3>
              <p className="text-muted-foreground text-sm">{t('landing.valueProposition.step2Description')}</p>
            </div>
            
            <div className="hidden md:block text-4xl text-muted-foreground">→</div>
            
            <div className="flex flex-col items-center text-center max-w-xs">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <Target className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">{t('landing.valueProposition.step3')}</h3>
              <p className="text-muted-foreground text-sm">{t('landing.valueProposition.step3Description')}</p>
            </div>
          </div>

          {/* Value Points */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <span className="font-medium">{t('landing.valueProposition.benefit1')}</span>
            </div>
            <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <span className="font-medium">{t('landing.valueProposition.benefit2')}</span>
            </div>
            <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <span className="font-medium">{t('landing.valueProposition.benefit3')}</span>
            </div>
          </div>

          <Button 
            size="lg" 
            className="bg-violet-600 hover:bg-violet-500 text-white px-8 py-4 rounded-xl"
            onClick={() => navigate('/resume-search')}
          >
            {t('landing.valueProposition.cta')}
          </Button>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-6">
            {t('landing.features.title')}
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-border/50">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                <Brain className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-lg">{t('landing.features.feature1.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-muted-foreground">
                {t('landing.features.feature1.description')}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-border/50">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-lg">{t('landing.features.feature2.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-muted-foreground">
                {t('landing.features.feature2.description')}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-border/50">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <CardTitle className="text-lg">{t('landing.features.feature3.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-muted-foreground">
                {t('landing.features.feature3.description')}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-border/50">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                <Target className="w-8 h-8 text-orange-600" />
              </div>
              <CardTitle className="text-lg">{t('landing.features.feature4.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-muted-foreground">
                {t('landing.features.feature4.description')}
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Why Choose TalentSpark */}
      <section className="bg-gradient-to-br from-slate-50 via-blue-50 to-violet-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-8">
                {t('landing.whyChoose.title')}
              </h2>
              <p className="text-xl text-muted-foreground mb-10">
                {t('landing.whyChoose.subtitle')}
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-foreground text-lg">{t('landing.whyChoose.benefit1')}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-foreground text-lg">{t('landing.whyChoose.benefit2')}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-foreground text-lg">{t('landing.whyChoose.benefit3')}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-foreground text-lg">{t('landing.whyChoose.benefit4')}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-foreground text-lg">{t('landing.whyChoose.benefit5')}</span>
                </div>
              </div>
              
              <Button 
                size="lg" 
                className="mt-10 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white px-8 py-4 rounded-xl"
                onClick={() => navigate('/auth?tab=signup')}
              >
                {t('landing.whyChoose.cta')}
              </Button>
            </div>
            
            <div className="bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-3xl p-10 border border-slate-200 dark:border-slate-600 shadow-2xl">
              <h3 className="text-xl font-bold text-center mb-8 text-foreground">{t('landing.whyChoose.statsTitle')}</h3>
              <div className="grid grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="text-5xl font-heading font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent mb-3">80%</div>
                  <div className="text-muted-foreground font-medium">{t('landing.whyChoose.stat1')}</div>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-heading font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent mb-3">98%</div>
                  <div className="text-muted-foreground font-medium">{t('landing.whyChoose.stat2')}</div>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-heading font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent mb-3">10K+</div>
                  <div className="text-muted-foreground font-medium">{t('landing.whyChoose.stat3')}</div>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-heading font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent mb-3">12</div>
                  <div className="text-muted-foreground font-medium">{t('landing.whyChoose.stat4')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-6">
            {t('landing.lovedByTeamsTitle')}
          </h2>
          <p className="text-xl text-muted-foreground">
            {t('landing.lovedByTeamsSubtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="group hover-lift border-border/50">
              <CardHeader>
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <CardDescription className="text-foreground text-lg leading-relaxed">
                  "{testimonial.content}"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-t border-border/50 pt-6">
                  <div className="font-heading font-semibold text-foreground text-lg">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
            {t('landing.finalCta.title')}
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-3xl mx-auto">
            {t('landing.finalCta.subtitle')}
          </p>
          
          <div className="flex justify-center mb-4">
            <Button 
              size="lg" 
              className="bg-teal-500 hover:bg-teal-400 text-white px-12 py-6 text-lg font-bold rounded-xl shadow-2xl hover:shadow-teal-500/25 transform hover:scale-105 transition-all"
              onClick={() => navigate('/auth?tab=signup')}
            >
              👉 {t('landing.finalCta.cta')}
            </Button>
          </div>
          
          <p className="text-sm text-white/70">
            {t('landing.finalCta.guarantee')}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <Logo size="lg" variant="dark" />
            
            <div className="text-sm text-slate-400 mt-4 md:mt-0">
              {t('landing.copyrightText')}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;