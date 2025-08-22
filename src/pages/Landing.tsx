import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Users, FileText, BarChart3, CheckCircle, Star, Zap, Shield, Clock, Brain, Target, TrendingUp, Search, Database, Filter, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Resume Analysis",
      description: "Advanced AI algorithms analyze resumes in seconds, extracting key skills, experience, and qualifications with 98% accuracy."
    },
    {
      icon: Search,
      title: "Intelligent Candidate Search",
      description: "Find perfect candidates from your database or external sources using natural language queries and smart filtering."
    },
    {
      icon: Database,
      title: "Comprehensive Database Search",
      description: "Search through millions of candidate profiles from leading job boards and professional networks instantly."
    },
    {
      icon: Zap,
      title: "Lightning-Fast Screening",
      description: "Process hundreds of resumes in minutes, not days. Get instant insights, rankings, and match scores."
    },
    {
      icon: Shield,
      title: "Bias-Free Hiring",
      description: "Eliminate unconscious bias with objective, data-driven candidate evaluation and fair assessment algorithms."
    },
    {
      icon: Target,
      title: "Perfect Job Matching",
      description: "Find ideal candidates using our proprietary skill-matching algorithm and cultural fit assessment."
    }
  ];

  const benefits = [
    "Reduce hiring time by up to 80%",
    "Access millions of candidate profiles",
    "Eliminate unconscious bias in recruitment", 
    "Process 10x more applications efficiently",
    "Improve candidate quality with AI insights",
    "Streamline your entire hiring workflow",
    "Make data-driven hiring decisions"
  ];

  const testimonials = [
    {
      name: "Алёна Смирнова",
      role: "HR Director",
      content: "TalentSpark revolutionized our hiring. The headhunter search feature helped us find senior developers we couldn't reach before - filled 3 positions in 2 weeks!",
      rating: 5
    },
    {
      name: "Дилшод Ахмедов", 
      role: "HR Specialist",
      content: "The candidate database search is incredible. We found perfect matches for niche roles that would have taken months to fill traditionally.",
      rating: 5
    },
    {
      name: "Анна Петрова",
      role: "HR Manager",
      content: "Best investment in HR tech. Our time-to-hire dropped from 45 to 12 days, and candidate quality improved dramatically.",
      rating: 5
    }
  ];

  const searchFeatures = [
    {
      icon: Search,
      title: "Smart Query Search",
      description: "Use natural language to find candidates: 'Senior React developer with 5+ years in fintech'"
    },
    {
      icon: Filter,
      title: "Advanced Filtering",
      description: "Filter by location, salary, experience, skills, education, and 50+ other criteria"
    },
    {
      icon: Database,
      title: "Multi-Source Access",
      description: "Search across Headhunter.uz, Linkedin, your own candidate database and others"
    },
    {
      icon: Sparkles,
      title: "AI Recommendations",
      description: "Get AI-suggested candidates based on your hiring patterns and success metrics"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/50 to-primary/5">
      {/* Header */}
      <header className="bg-surface/80 backdrop-blur-sm shadow-subtle border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Logo size="md" variant="light" />

          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/auth?tab=signin')}>
              Sign In
            </Button>
            <Button className="bg-gradient-to-r from-primary to-accent hover:shadow-glow" onClick={() => navigate('/auth?tab=signup')}>
              Get Started Free
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge variant="secondary" className="mb-8 px-6 py-3 text-sm bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          🚀 Trusted by 50+ HR teams worldwide
        </Badge>
        
        <h1 className="text-5xl md:text-7xl font-heading font-bold text-foreground mb-8 leading-tight">
          Find Perfect Candidates
          <br />
          <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
            10x Faster
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
          Revolutionary AI-powered recruitment platform combining resume analysis with 
          intelligent candidate search across millions of profiles. Find, screen, and hire 
          the perfect talent in minutes, not months.
        </p>

        {/* Platform Integration Icons */}
        <div className="flex items-center justify-center gap-8 mb-12">
          <div className="flex items-center gap-3 bg-surface/80 backdrop-blur-sm rounded-xl px-6 py-4 border border-border/50 shadow-subtle">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">in</span>
            </div>
            <span className="text-foreground font-medium">LinkedIn Integration</span>
          </div>
          
          <div className="flex items-center gap-3 bg-surface/80 backdrop-blur-sm rounded-xl px-6 py-4 border border-border/50 shadow-subtle">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">HH</span>
            </div>
            <span className="text-foreground font-medium">HeadHunter.uz</span>
          </div>
          
          <div className="flex items-center gap-3 bg-surface/80 backdrop-blur-sm rounded-xl px-6 py-4 border border-border/50 shadow-subtle">
            <Upload className="w-8 h-8 text-primary" />
            <span className="text-foreground font-medium">Bulk Resume Upload</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-primary to-accent hover:shadow-glow px-10 py-6 text-lg font-medium"
            onClick={() => navigate('/auth?tab=signup')}
          >
            Start Free Trial
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          No credit card required • 14-day free trial • Cancel anytime
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
                  <div className="text-4xl font-heading font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">50+</div>
                  <div className="text-muted-foreground">Companies</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-heading font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">10K+</div>
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