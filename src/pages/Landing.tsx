import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Users, FileText, BarChart3, CheckCircle, Star, Zap, Shield, Clock, Brain, Target, TrendingUp, Search, Database, Filter, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import Logo from '@/components/Logo';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const Landing = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const features = [
    {
      icon: Brain,
      title: t('features.ai-analysis.title'),
      description: t('features.ai-analysis.description')
    },
    {
      icon: Search,
      title: t('features.search.title'),
      description: t('features.search.description')
    },
    {
      icon: Database,
      title: t('features.database.title'),
      description: t('features.database.description')
    },
    {
      icon: Zap,
      title: t('features.screening.title'),
      description: t('features.screening.description')
    },
    {
      icon: Shield,
      title: t('features.bias-free.title'),
      description: t('features.bias-free.description')
    },
    {
      icon: Target,
      title: t('features.matching.title'),
      description: t('features.matching.description')
    }
  ];

  const benefits = [
    t('benefits.time'),
    t('benefits.profiles'),
    t('benefits.bias'),
    t('benefits.efficiency'),
    t('benefits.quality'),
    t('benefits.workflow'),
    t('benefits.decisions')
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Head of Talent, TechCorp",
      content: "TalentSpark revolutionized our hiring. The headhunter search feature helped us find senior developers we couldn't reach before - filled 3 positions in 2 weeks!",
      rating: 5
    },
    {
      name: "Michael Chen", 
      role: "Senior Recruiter, GrowthVentures",
      content: "The candidate database search is incredible. We found perfect matches for niche roles that would have taken months to fill traditionally.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "VP People Operations, ScaleUp",
      content: "Best investment in HR tech. Our time-to-hire dropped from 45 to 12 days, and candidate quality improved dramatically.",
      rating: 5
    }
  ];

  const searchFeatures = [
    {
      icon: Search,
      title: t('search.smart-query.title'),
      description: t('search.smart-query.description')
    },
    {
      icon: Filter,
      title: t('search.filtering.title'),
      description: t('search.filtering.description')
    },
    {
      icon: Database,
      title: t('search.multi-source.title'),
      description: t('search.multi-source.description')
    },
    {
      icon: Sparkles,
      title: t('search.ai-recommendations.title'),
      description: t('search.ai-recommendations.description')
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
              {t('landing.auth.signin')}
            </Button>
            <Button className="bg-gradient-to-r from-primary to-accent hover:shadow-glow" onClick={() => navigate('/auth?tab=signup')}>
              {t('landing.auth.signup')}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge variant="secondary" className="mb-8 px-6 py-3 text-sm bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          {t('landing.hero.badge')}
        </Badge>
        
        <h1 className="text-5xl md:text-7xl font-heading font-bold text-foreground mb-8 leading-tight">
          {t('landing.hero.title')}
          <br />
          <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
            {t('landing.hero.subtitle')}
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
          {t('landing.hero.description')}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-primary to-accent hover:shadow-glow px-10 py-6 text-lg font-medium"
            onClick={() => navigate('/auth?tab=signup')}
          >
            {t('landing.hero.cta')}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          {t('landing.hero.no-card')}
        </p>
      </section>

      {/* Headhunter Search Feature Highlight */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-br from-surface to-surface/50 rounded-3xl border border-border/50 shadow-elegant p-12">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-gradient-to-r from-success/10 to-accent/10 text-success border-success/20">
              New Feature
            </Badge>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-6">
              Intelligent Candidate Search
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Access millions of candidate profiles with AI-powered search. Find passive candidates, 
              niche specialists, and perfect cultural fits that traditional methods miss.
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
              Try Search Feature
            </Button>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-6">
            Powerful Features for Modern Hiring
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to revolutionize your recruitment process and find exceptional talent
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
                Why Choose TalentSpark?
              </h2>
              <p className="text-xl text-muted-foreground mb-10">
                Join thousands of companies that have revolutionized their hiring process and 
                discovered top talent they never knew existed.
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
                Get Started Today
              </Button>
            </div>
            
            <div className="bg-gradient-to-br from-surface to-muted/20 rounded-3xl p-10 border border-border/50 shadow-elegant">
              <div className="grid grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-heading font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">80%</div>
                  <div className="text-muted-foreground">Faster Hiring</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-heading font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">98%</div>
                  <div className="text-muted-foreground">Match Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-heading font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">1K+</div>
                  <div className="text-muted-foreground">Companies</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-heading font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">5M+</div>
                  <div className="text-muted-foreground">Profiles Searched</div>
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
            Loved by HR Teams Worldwide
          </h2>
          <p className="text-xl text-muted-foreground">
            See how TalentSpark is transforming recruitment for leading companies
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
            Ready to Transform Your Hiring?
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-3xl mx-auto">
            Join thousands of HR professionals who have revolutionized their recruitment process 
            and discovered top talent with TalentSpark's AI-powered platform.
          </p>
          
          <div className="flex justify-center">
            <Button 
              size="lg" 
              variant="secondary" 
              className="px-10 py-6 text-lg bg-white hover:bg-white/90 text-primary"
              onClick={() => navigate('/auth?tab=signup')}
            >
              Start Your Free Trial
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
              © 2024 TalentSpark. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;