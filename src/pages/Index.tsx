
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Users, FileText, BarChart3, Settings, Plus, Filter, Download, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import UploadSection from '@/components/UploadSection';
import CandidateTable from '@/components/CandidateTable';
import StatsCards from '@/components/StatsCards';
import ResumeSearch from '@/pages/ResumeSearch';
import { useCandidates, type Candidate } from '@/hooks/useCandidates';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { formatDistanceToNow } from 'date-fns';
import SearchResultsModal from '@/components/SearchResultsModal';
import CandidateDetailModal from '@/components/CandidateDetailModal';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, loading } = useAuth();
  const navigate = useNavigate();

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
      .filter((c: any) => c && c.created_at)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [candidates]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-sm">HR</span>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'upload', label: 'Upload Resumes', icon: Upload },
            { id: 'hh-search', label: 'HH Candidate Search', icon: Search },
            { id: 'candidates', label: 'Candidates', icon: Users },
            { id: 'forms', label: 'Application Forms', icon: FileText },
          ].map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={activeTab === id ? 'default' : 'outline'}
              onClick={() => setActiveTab(id)}
              className="flex items-center gap-2"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Button>
          ))}
        </div>

        {/* Content based on active tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  HR Screening Dashboard
                </h1>
                <p className="text-gray-600">
                  Automate candidate screening with AI-powered resume analysis
                </p>
              </div>
              <Badge variant="secondary" className="px-3 py-1">
                Welcome back, {user.email}!
              </Badge>
            </div>

            <StatsCards />

            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-indigo-600" />
                    Quick Upload
                  </CardTitle>
                  <CardDescription>
                    Upload multiple resumes and get instant AI analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => setActiveTab('upload')} 
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    Start Screening Process
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    Application Forms
                  </CardTitle>
                  <CardDescription>
                    Create custom forms for candidate submissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => setActiveTab('forms')} 
                    variant="outline" 
                    className="w-full"
                  >
                    Build New Form
                  </Button>
                </CardContent>
              </Card>
            </div>

<div className="grid lg:grid-cols-2 gap-8">
              {/* Recent HH Searches */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent HH Searches</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('hh-search')}>
                      View all
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingSearches ? (
                    <div className="space-y-3">
                      <div className="h-10 rounded-md bg-muted animate-pulse" />
                      <div className="h-10 rounded-md bg-muted animate-pulse" />
                      <div className="h-10 rounded-md bg-muted animate-pulse" />
                    </div>
                  ) : recentSearches.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No HH searches yet.</div>
                  ) : (
                    <div className="space-y-4">
                      {recentSearches.map((s) => (
                        <div key={s.id} className="flex justify-between items-start p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-start gap-3">
                            <Search className="w-4 h-4 text-emerald-600 mt-1" />
                            <div>
                              <div className="text-sm font-medium">HH Search — {s.job_title}</div>
                              <div className="text-xs text-muted-foreground">
                                {s.experience_level} • {s.required_skills} • {s.candidate_count} candidates
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">HH Search</Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                            </span>
                            <Button size="sm" variant="outline" onClick={() => { setSelectedSearch(s); setSearchModalOpen(true); }}>
                              View
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Resume Uploads */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Resume Uploads</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('candidates')}>
                      View all
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingCandidates ? (
                    <div className="space-y-3">
                      <div className="h-10 rounded-md bg-muted animate-pulse" />
                      <div className="h-10 rounded-md bg-muted animate-pulse" />
                      <div className="h-10 rounded-md bg-muted animate-pulse" />
                    </div>
                  ) : recentUploads.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No resume uploads yet.</div>
                  ) : (
                    <div className="space-y-4">
                      {recentUploads.map((c: any) => (
                        <div key={c.id} className="flex justify-between items-start p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-start gap-3">
                            <Upload className="w-4 h-4 text-indigo-600 mt-1" />
                            <div>
                              <div className="text-sm font-medium">Resume uploaded — {c.name || c.original_filename || 'Unknown'}</div>
                              <div className="text-xs text-muted-foreground">
                                {(c.position || 'Candidate')} • {c.status}{typeof c.ai_score === 'number' ? ` • AI Score ${c.ai_score}` : ''}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">Upload</Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                            </span>
                            <Button size="sm" variant="outline" onClick={() => { setSelectedCandidate(c); setCandidateModalOpen(true); }}>
                              View
                            </Button>
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
        
        {activeTab === 'candidates' && <CandidateTable />}
        
        {activeTab === 'forms' && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Form Builder Coming Soon
            </h3>
            <p className="text-gray-500 mb-6">
              Create custom application forms with our drag-and-drop builder
            </p>
            <Button disabled className="bg-gray-300">
              <Plus className="w-4 h-4 mr-2" />
              Create New Form
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
