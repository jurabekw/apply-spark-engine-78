
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Users, FileText, BarChart3, Settings, Plus, Filter, Download, Search, ArrowRight, TrendingUp, Clock, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import UploadSection from '@/components/UploadSection';
import CandidateTable from '@/components/CandidateTable';
import StatsCards from '@/components/StatsCards';
import ResumeSearch from '@/pages/ResumeSearch';
import LinkedinSearch from '@/pages/LinkedinSearch';
import { useCandidates, type Candidate } from '@/hooks/useCandidates';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { formatDistanceToNow } from 'date-fns';
import SearchResultsModal from '@/components/SearchResultsModal';
import CandidateDetailModal from '@/components/CandidateDetailModal';
import { useTranslation } from 'react-i18next';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  const { searches, loading: loadingSearches } = useSearchHistory();
  const { candidates, loading: loadingCandidates } = useCandidates();

  const [selectedSearch, setSelectedSearch] = useState<any | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [candidateModalOpen, setCandidateModalOpen] = useState(false);

const recentSearches = useMemo(() => {
    return (searches || [])
      .filter((s) => s && s.created_at)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [searches]);

  const recentUploads = useMemo(() => {
    return (candidates || [])
      .filter((c: any) => c && c.created_at && (c.source === 'upload' || c.resume_file_path || c.original_filename))
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [candidates]);

  // Handle global search from URL parameters or events
  useEffect(() => {
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      setGlobalSearchTerm(searchQuery);
      setActiveTab('candidates'); // Switch to candidates tab to show search results
      // Clear the search parameter after applying it
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('search');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Listen for global search events from header
  useEffect(() => {
    const handleGlobalSearch = (event: any) => {
      const query = event.detail?.query;
      if (query) {
        setGlobalSearchTerm(query);
        setActiveTab('candidates'); // Switch to candidates tab to show search results
      }
    };

    window.addEventListener('global-search', handleGlobalSearch);
    return () => window.removeEventListener('global-search', handleGlobalSearch);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse-ring">
            <div className="w-6 h-6 bg-white rounded-full"></div>
          </div>
          <p className="text-muted-foreground">{t('loading.dashboard')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-6 py-8">
        {/* Modern Tab Navigation */}
        <div className="bg-card rounded-xl border border-border/50 p-2 mb-8 shadow-sm">
          <div className="flex flex-wrap gap-1">
            {[
              { id: 'dashboard', label: t('navigation.dashboard'), icon: BarChart3 },
              { id: 'upload', label: t('navigation.uploadResumes'), icon: Upload },
              { id: 'hh-search', label: t('navigation.hhCandidateSearch'), icon: Search },
              { id: 'linkedin-search', label: t('navigation.linkedinSearch'), icon: Users },
              { id: 'candidates', label: t('navigation.candidates'), icon: Users },
              { id: 'forms', label: t('navigation.applicationForms'), icon: FileText },
            ].map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant={activeTab === id ? 'default' : 'ghost'}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 relative ${
                  activeTab === id 
                    ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md' 
                    : 'hover:bg-muted'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
                {activeTab === id && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="flex justify-between items-start mb-8 animate-fade-in">
              <div>
                <h1 className="text-4xl font-heading font-bold text-foreground mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {t('dashboard.welcome')}
                </h1>
                <p className="text-lg text-muted-foreground">
                  {t('dashboard.overview')} • {new Date().toLocaleDateString('ru-RU', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
                <Badge variant="brand" className="px-4 py-2 text-sm font-medium animate-bounce-in">
                <Clock className="w-4 h-4 mr-2" />
                {t('status.online')}
              </Badge>
            </div>

            <StatsCards />

            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="group bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 hover-lift animate-slide-up">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-xl shadow-md group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <CardTitle className="text-xl">{t('dashboard.uploadResumes')}</CardTitle>
                  <CardDescription>
                    {t('dashboard.uploadDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => setActiveTab('upload')} 
                    variant="default"
                    className="w-full"
                  >
                    {t('common.upload')}
                  </Button>
                </CardContent>
              </Card>

              <Card className="group bg-gradient-to-br from-success/5 to-emerald-400/5 border-success/20 hover-lift animate-slide-up" style={{ animationDelay: '100ms' }}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-gradient-to-br from-success to-emerald-500 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                      <Search className="w-6 h-6 text-white" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-success transition-colors" />
                  </div>
                  <CardTitle className="text-xl">{t('dashboard.hhSearchTitle')}</CardTitle>
                  <CardDescription>
                    {t('dashboard.hhSearchDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => setActiveTab('hh-search')} 
                    variant="success"
                    className="w-full"
                  >
                    {t('common.search')}
                  </Button>
                </CardContent>
              </Card>

              <Card className="group bg-gradient-to-br from-blue-500/5 to-blue-600/5 border-blue-500/20 hover-lift animate-slide-up" style={{ animationDelay: '150ms' }}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                  </div>
                  <CardTitle className="text-xl">{t('dashboard.linkedinSearch')}</CardTitle>
                  <CardDescription>
                    {t('dashboard.linkedinSearchDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => setActiveTab('linkedin-search')} 
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                  >
                    {t('dashboard.linkedinSearchButton')}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent HH Searches */}
              <Card className="animate-slide-up" style={{ animationDelay: '200ms' }}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Search className="w-5 h-5 text-success" />
                      {t('dashboard.recentSearches')}
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('hh-search')} className="text-success hover:text-success">
                      {t('dashboard.viewAll')} <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingSearches ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
                      ))}
                    </div>
                  ) : recentSearches.length === 0 ? (
                    <div className="text-center py-6">
                      <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">{t('dashboard.noRecentSearches')}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentSearches.map((s, i) => (
                        <div key={s.id} className="group p-4 bg-muted/30 hover:bg-muted/50 rounded-lg border border-border/50 hover:border-success/30 transition-all duration-200">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-foreground mb-1">{s.job_title}</div>
                              <div className="text-xs text-muted-foreground mb-2">
                                {s.experience_level} • {s.required_skills}
                              </div>
                              <Badge variant="success" className="text-xs">{s.candidate_count} {t('loading.found')}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                              </span>
                              <Button size="xs" variant="ghost" onClick={() => { setSelectedSearch(s); setSearchModalOpen(true); }}>
                                <Eye className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Resume Uploads */}
              <Card className="animate-slide-up" style={{ animationDelay: '300ms' }}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="w-5 h-5 text-primary" />
                      {t('dashboard.recentUploads')}
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('candidates')} className="text-primary hover:text-primary">
                      {t('candidates.viewAll')} <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingCandidates ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
                      ))}
                    </div>
                  ) : recentUploads.length === 0 ? (
                    <div className="text-center py-6">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">{t('dashboard.noRecentUploads')}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentUploads.map((c: any, i) => (
                        <div key={c.id} className="group p-4 bg-muted/30 hover:bg-muted/50 rounded-lg border border-border/50 hover:border-primary/30 transition-all duration-200">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-foreground mb-1">{c.name || c.original_filename || 'Unknown'}</div>
                              <div className="text-xs text-muted-foreground mb-2">
                                {c.position || 'Candidate'} • {c.status}
                              </div>
                              {typeof c.ai_score === 'number' && (
                                <Badge variant="brand" className="text-xs">{c.ai_score}% {t('loading.match')}</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                              </span>
                              <Button size="xs" variant="ghost" onClick={() => { setSelectedCandidate(c); setCandidateModalOpen(true); }}>
                                <Eye className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'upload' && <UploadSection />}
        
        {activeTab === 'hh-search' && <ResumeSearch />}
        
        {activeTab === 'linkedin-search' && <LinkedinSearch />}
        
        {activeTab === 'candidates' && <CandidateTable initialSearchTerm={globalSearchTerm} />}
        
        {activeTab === 'forms' && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {t('forms.comingSoonTitle')}
            </h3>
            <p className="text-gray-500 mb-6">
              {t('forms.comingSoonDescription')}
            </p>
            <Button disabled className="bg-gray-300">
              <Plus className="w-4 h-4 mr-2" />
              {t('forms.createNewForm')}
            </Button>
          </div>
        )}
      </div>

      {/* Detail Modals */}
      <SearchResultsModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        search={selectedSearch}
      />
      <CandidateDetailModal
        candidate={selectedCandidate}
        isOpen={candidateModalOpen}
        onClose={() => setCandidateModalOpen(false)}
      />
    </div>
  );
};

export default Index;
