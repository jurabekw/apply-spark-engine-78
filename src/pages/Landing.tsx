import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Users, FileText, BarChart3, CheckCircle, Star, Zap, Shield, Clock, Brain, Target, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
const Landing = () => {
  const navigate = useNavigate();
  const features = [{
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Advanced AI algorithms analyze resumes and match candidates to job requirements with 95% accuracy."
  }, {
    icon: Zap,
    title: "Instant Screening",
    description: "Process hundreds of resumes in minutes, not hours. Get instant insights and rankings."
  }, {
    icon: Shield,
    title: "Bias-Free Hiring",
    description: "Eliminate unconscious bias with objective, data-driven candidate evaluation."
  }, {
    icon: Target,
    title: "Perfect Match",
    description: "Find the perfect candidate match using our proprietary skill-matching algorithm."
  }, {
    icon: Clock,
    title: "Save Time",
    description: "Reduce hiring time by 70% with automated screening and intelligent candidate ranking."
  }, {
    icon: TrendingUp,
    title: "Better Outcomes",
    description: "Improve hire quality with predictive analytics and performance indicators."
  }];
  const benefits = ["Reduce hiring time by up to 70%", "Eliminate unconscious bias in recruitment", "Process 10x more applications efficiently", "Improve candidate quality with AI insights", "Streamline your entire hiring workflow", "Make data-driven hiring decisions"];
  const testimonials = [{
    name: "Sarah Johnson",
    role: "Head of HR, TechCorp",
    content: "TalentSpark transformed our hiring process. We now identify top candidates 3x faster and with much better accuracy.",
    rating: 5
  }, {
    name: "Michael Chen",
    role: "Recruiting Manager, StartupXYZ",
    content: "The AI-powered screening is incredible. It caught qualified candidates we would have missed with manual review.",
    rating: 5
  }, {
    name: "Emily Rodriguez",
    role: "VP People Operations, GrowthCo",
    content: "Best investment we've made in HR tech. Our time-to-hire dropped from 45 days to 15 days.",
    rating: 5
  }];
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">HR</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">TalentSpark</h1>
              <p className="text-xs text-gray-500">AI-Powered Recruitment</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/auth?tab=signin')}>
              Sign In
            </Button>
            <Button onClick={() => navigate('/auth?tab=signup')}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm">
          🚀 Join 500+ HR teams already using TalentSpark
        </Badge>
        
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Hire the Right Talent
          <br />
          <span className="text-indigo-600">with AI Precision</span>
        </h1>
        
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
          Transform your recruitment process with AI-powered resume screening. 
          Find perfect candidates faster, eliminate bias, and make data-driven hiring decisions.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 px-8 py-4 text-lg" onClick={() => navigate('/auth?tab=signup')}>
            Start Free Trial
          </Button>
          <Button variant="outline" size="lg" className="px-8 py-4 text-lg" onClick={() => navigate('/auth?tab=signin')}>
            Watch Demo
          </Button>
        </div>

        <p className="text-sm text-gray-500 mt-4">
          No credit card required • 14-day free trial • Cancel anytime
        </p>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Powerful Features for Modern Hiring
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to streamline your recruitment process and find the best candidates
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>)}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Why Choose TalentSpark?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Join hundreds of companies that have revolutionized their hiring process
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>)}
              </div>
              
              <Button size="lg" className="mt-8 bg-indigo-600 hover:bg-indigo-700" onClick={() => navigate('/auth?tab=signup')}>
                Get Started Today
              </Button>
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600 mb-2">70%</div>
                  <div className="text-gray-600">Faster Hiring</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600 mb-2">95%</div>
                  <div className="text-gray-600">Match Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600 mb-2">500+</div>
                  <div className="text-gray-600">Companies</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600 mb-2">10k+</div>
                  <div className="text-gray-600">Resumes Processed</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Loved by HR Teams Worldwide
          </h2>
          <p className="text-xl text-gray-600">
            See what our customers have to say about TalentSpark
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
                </div>
                <CardDescription className="text-gray-700 text-base leading-relaxed">
                  "{testimonial.content}"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-t pt-4">
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                </div>
              </CardContent>
            </Card>)}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-indigo-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Hiring?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Join thousands of HR professionals who have streamlined their recruitment process with TalentSpark
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="px-8 py-4 text-lg" onClick={() => navigate('/auth?tab=signup')}>
              Start Your Free Trial
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth?tab=signin')} className="px-8 py-4 text-lg border-white hover:bg-white text-indigo-500">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">HR</span>
              </div>
              <div>
                <div className="text-lg font-bold">TalentSpark</div>
                <div className="text-sm text-gray-400">AI-Powered Recruitment</div>
              </div>
            </div>
            
            <div className="text-sm text-gray-400">
              © 2024 TalentSpark. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>;
};
export default Landing;