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
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge variant="secondary" className="mb-8 px-6 py-3 text-sm bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          🚀 {t('landing.trustedByTeams')}
        </Badge>
        
        <h1 className="text-5xl md:text-7xl font-heading font-bold text-foreground mb-8 leading-tight">
          {t('landing.title')}
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
          {t('landing.subtitle')}
        </p>

        {/* Platform Integration Icons */}
        <div className="flex items-center justify-center gap-8 mb-12">
          <div className="flex items-center gap-3 bg-surface/80 backdrop-blur-sm rounded-xl px-6 py-4 border border-border/50 shadow-subtle">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">in</span>
            </div>
            <span className="text-foreground font-medium">{t('landing.linkedinIntegration')}</span>
          </div>
          
          <div className="flex items-center gap-3 bg-surface/80 backdrop-blur-sm rounded-xl px-6 py-4 border border-border/50 shadow-subtle">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">HH</span>
            </div>
            <span className="text-foreground font-medium">HeadHunter.uz</span>
          </div>
          
          <div className="flex items-center gap-3 bg-surface/80 backdrop-blur-sm rounded-xl px-6 py-4 border border-border/50 shadow-subtle">
            <Upload className="w-8 h-8 text-primary" />
            <span className="text-foreground font-medium">{t('landing.bulkResumeUpload')}</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-primary to-accent hover:shadow-glow px-10 py-6 text-lg font-medium"
            onClick={() => navigate('/auth?tab=signup')}
          >
            {t('landing.startFreeTrial')}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          {t('landing.noCreditCardRequired')}
        </p>
      </section>

      {/* Headhunter Search Feature Highlight */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-br from-surface to-surface/50 rounded-3xl border border-border/50 shadow-elegant p-12">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-gradient-to-r from-success/10 to-accent/10 text-success border-success/20">
              {t('landing.newFeature')}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-6">
              {t('landing.intelligentCandidateSearch')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('landing.candidateSearchDescription')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {searchFeatures.map((feature, index) => (
              <Card key={index} className="group hover-lift border-border/50">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                    <feature.icon className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-primary to-accent hover:shadow-glow px-8 py-4"
              onClick={() => navigate('/resume-search')}
            >
              {t('landing.trySearchFeature')}
            </Button>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-6">
            {t('landing.powerfulFeaturesTitle')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('landing.powerfulFeaturesSubtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="group hover-lift border-border/50">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl font-heading">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gradient-to-br from-surface via-surface/80 to-primary/5 py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-8">
                {t('landing.whyChooseTitle')}
              </h2>
              <p className="text-xl text-muted-foreground mb-10">
                {t('landing.whyChooseSubtitle')}
              </p>
              
              <div className="space-y-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-6 h-6 bg-gradient-to-br from-success to-success/80 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-foreground text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
              
              <Button 
                size="lg" 
                className="mt-10 bg-gradient-to-r from-primary to-accent hover:shadow-glow px-8 py-4"
                onClick={() => navigate('/auth?tab=signup')}
              >
                {t('landing.getStartedToday')}
              </Button>
            </div>
            
            <div className="bg-gradient-to-br from-surface to-muted/20 rounded-3xl p-10 border border-border/50 shadow-elegant">
              <div className="grid grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-heading font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">80%</div>
                  <div className="text-muted-foreground">{t('landing.fasterHiring')}</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-heading font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">98%</div>
                  <div className="text-muted-foreground">{t('landing.matchAccuracy')}</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-heading font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">50+</div>
                  <div className="text-muted-foreground">{t('landing.companies')}</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-heading font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">10K+</div>
                  <div className="text-muted-foreground">{t('landing.profilesSearched')}</div>
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

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary via-accent to-primary py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
            {t('landing.readyToTransformCTA')}
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-3xl mx-auto">
            {t('landing.ctaSubtitle')}
          </p>
          
          <div className="flex justify-center">
            <Button 
              size="lg" 
              variant="secondary" 
              className="px-10 py-6 text-lg bg-white hover:bg-white/90 text-primary"
              onClick={() => navigate('/auth?tab=signup')}
            >
              {t('landing.startYourFreeTrial')}
            </Button>
          </div>
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