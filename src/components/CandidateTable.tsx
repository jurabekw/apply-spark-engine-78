
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Search, Download, Star, Eye, Loader2, Trash2, ExternalLink, Filter, ArrowUpDown, MoreHorizontal, User, Users, Mail, MapPin, Calendar, Award } from 'lucide-react';
import { useCandidates } from '@/hooks/useCandidates';
import CandidateDetailModal from './CandidateDetailModal';
import { useTranslation } from 'react-i18next';

interface CandidateTableProps {
  initialSearchTerm?: string;
}

const CandidateTable = ({ initialSearchTerm = '' }: CandidateTableProps) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'upload' | 'hh_search' | 'linkedin_search'>('all');
  const { candidates, loading, updateCandidateStatus, deleteCandidate, refetch } = useCandidates();

  // Update search term when initialSearchTerm changes
  useEffect(() => {
    setSearchTerm(initialSearchTerm);
  }, [initialSearchTerm]);

  // Listen for candidate updates from HH search
  useEffect(() => {
    const handleCandidatesUpdated = () => {
      refetch();
    };

    window.addEventListener('candidatesUpdated', handleCandidatesUpdated);
    return () => {
      window.removeEventListener('candidatesUpdated', handleCandidatesUpdated);
    };
  }, [refetch]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'shortlisted': return 'success';
      case 'interviewed': return 'brand';
      case 'reviewing': return 'warning';
      case 'rejected': return 'destructive';
      case 'hired': return 'default';
      default: return 'secondary';
    }
  };

  const getScoreColor = (score: number | undefined) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 85) return 'text-success';
    if (score >= 70) return 'text-brand';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreLabel = (score: number | undefined) => {
    if (!score) return t('messages.noScore');
    if (score >= 85) return t('messages.excellent');
    if (score >= 70) return t('messages.good');
    if (score >= 60) return t('messages.fair');
    return t('messages.poor');
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'new': t('scoreLabels.new'),
      'reviewing': t('scoreLabels.reviewing'),
      'shortlisted': t('scoreLabels.shortlisted'),
      'interviewed': t('scoreLabels.interviewed'),
      'hired': t('scoreLabels.hired'),
      'rejected': t('scoreLabels.rejected')
    };
    return labels[status as keyof typeof labels] || status;
  };

  const term = searchTerm.toLowerCase();
  const filteredCandidates = candidates.filter(candidate => {
    // Source filter
    if (sourceFilter !== 'all') {
      if (sourceFilter === 'upload' && candidate.source !== 'upload') return false;
      if (sourceFilter === 'hh_search' && candidate.source !== 'hh_search') return false;
      if (sourceFilter === 'linkedin_search' && candidate.source !== 'linkedin_search') return false;
    }
    // Text search
    const name = (candidate.name || '').toLowerCase();
    const email = (candidate.email || '').toLowerCase();
    const position = (candidate.position || '').toLowerCase();
    return !term ? true : name.includes(term) || email.includes(term) || position.includes(term);
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const escapeCSV = (val: any) => {
    const s = String(val ?? '');
    if (/[",\n]/.test(s)) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };

  const handleExport = () => {
    const rows = filteredCandidates.map((c) => ({
      name: c.name,
      email: c.email,
      phone: c.phone,
      position: c.position,
      ai_score: c.ai_score ?? '',
      experience_years: c.experience_years ?? '',
      skills: Array.isArray(c.skills) ? c.skills.join('; ') : '',
      source: c.source === 'hh_search' ? t('messages.hhruLabel') : c.source === 'linkedin_search' ? t('messages.linkedinLabel') : t('messages.uploadedLabel'),
      submitted_at: c.submitted_at || c.created_at,
      hh_url: (c as any).ai_analysis?.hh_url ?? ''
    }));

    const headers = [
      t('messages.csvHeaders.name'),
      t('messages.csvHeaders.email'),
      t('messages.csvHeaders.phone'),
      t('messages.csvHeaders.position'),
      t('messages.csvHeaders.aiScore'),
      t('messages.csvHeaders.experienceYears'),
      t('messages.csvHeaders.skills'),
      t('messages.csvHeaders.source'),
      t('messages.csvHeaders.submittedAt'),
      t('messages.csvHeaders.hhUrl')
    ];
    const csv = [
      headers.join(','),
      ...rows.map(r => [
        escapeCSV(r.name),
        escapeCSV(r.email),
        escapeCSV(r.phone),
        escapeCSV(r.position),
        r.ai_score,
        r.experience_years,
        escapeCSV(r.skills),
        escapeCSV(r.source),
        escapeCSV(r.submitted_at),
        escapeCSV(r.hh_url)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const prefix = sourceFilter === 'all' ? 'all' : sourceFilter === 'upload' ? 'uploaded' : 'hh';
    link.href = url;
    link.setAttribute('download', `candidates-${prefix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleStatusChange = async (candidateId: string, newStatus: string) => {
    await updateCandidateStatus(candidateId, newStatus);
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    await deleteCandidate(candidateId);
  };

  const handleViewCandidate = (candidate: any) => {
    setSelectedCandidate(candidate);
    setIsDetailModalOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-heading font-bold text-foreground">{t('messages.candidateDatabase')}</h2>
            <p className="text-muted-foreground">{t('messages.manageCandidates')}</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">{t('messages.loadingCandidates')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-heading font-bold text-foreground">{t('messages.candidateDatabase')}</h2>
            <p className="text-muted-foreground">{t('messages.manageCandidates')}</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Source Filter Pills */}
            <div className="inline-flex bg-muted rounded-lg p-1">
              <Button 
                variant={sourceFilter === 'all' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setSourceFilter('all')}
                className={sourceFilter === 'all' ? 'shadow-sm' : ''}
              >
{t('buttons.all')}
              </Button>
              <Button 
                variant={sourceFilter === 'upload' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setSourceFilter('upload')}
                className={sourceFilter === 'upload' ? 'shadow-sm' : ''}
              >
{t('buttons.uploaded')}
              </Button>
              <Button 
                variant={sourceFilter === 'hh_search' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setSourceFilter('hh_search')}
                className={sourceFilter === 'hh_search' ? 'shadow-sm' : ''}
              >
{t('buttons.hhSearch')}
              </Button>
              <Button 
                variant={sourceFilter === 'linkedin_search' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setSourceFilter('linkedin_search')}
                className={sourceFilter === 'linkedin_search' ? 'shadow-sm' : ''}
              >
{t('buttons.linkedinSearch')}
              </Button>
            </div>
            
            <Button variant="outline" onClick={handleExport} disabled={filteredCandidates.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              {t('buttons.exportCsv')}
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder={t('placeholders.searchCandidates')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-base"
              />
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                {t('labels.candidates')} ({filteredCandidates.length})
              </CardTitle>
              {filteredCandidates.length > 0 && (
                 <Badge variant="secondary" className="px-3 py-1">
                    {sourceFilter === 'all' ? t('buttons.all') + ' ' + t('messages.sources') : 
                     sourceFilter === 'upload' ? t('buttons.uploaded') : 
                     sourceFilter === 'hh_search' ? t('buttons.hhSearch') : t('buttons.linkedinSearch')}
                 </Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            {filteredCandidates.length === 0 ? (
              <div className="text-center py-12 animate-fade-in">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {t('messages.noCandidatesFound')}
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {candidates.length === 0 
                    ? t('messages.candidatesDescription')
                    : t('messages.candidatesTryAdjusting')
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCandidates.map((candidate, index) => (
                  <div 
                    key={candidate.id} 
                    className="group p-6 bg-gradient-to-r from-card to-card/50 border border-border/50 rounded-xl hover-lift transition-all duration-200 hover:border-primary/20 animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Candidate Info */}
                      <div className="flex items-start gap-4 flex-1">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center border-2 border-primary/20">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        
                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                               <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                                 {candidate.name || t('messages.unknownCandidate')}
                               </h3>
                               <p className="text-sm text-muted-foreground flex items-center gap-1">
                                 <Mail className="w-3 h-3" />
                                 {candidate.email || t('messages.noEmailProvided')}
                               </p>
                            </div>
                            
                            {/* AI Score Badge */}
                            {candidate.ai_score && (
                              <div className="flex items-center gap-2">
                                <div className={`text-right ${getScoreColor(candidate.ai_score)}`}>
                                  <div className="text-lg font-bold">{candidate.ai_score}%</div>
                                  <div className="text-xs">{getScoreLabel(candidate.ai_score)}</div>
                                </div>
                                {candidate.ai_score >= 85 && (
                                  <Award className="w-5 h-5 text-warning" />
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Meta Info */}
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                            {candidate.position && (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {candidate.position}
                              </div>
                            )}
                            {candidate.experience_years && (
                               <div className="flex items-center gap-1">
                                 <Calendar className="w-3 h-3" />
                                 {candidate.experience_years} {t('messages.years')}
                               </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(candidate.submitted_at || candidate.created_at)}
                            </div>
                          </div>
                          
                          {/* Skills & Status Row */}
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={getStatusVariant(candidate.status)} className="font-medium">
                              {getStatusLabel(candidate.status)}
                            </Badge>
                            
                            <Badge 
                              variant={candidate.source === 'hh_search' ? 'brand' : candidate.source === 'linkedin_search' ? 'brand' : 'secondary'}
                              className="text-xs"
                            >
                              {candidate.source === 'hh_search' ? t('messages.hhruLabel') : candidate.source === 'linkedin_search' ? t('messages.linkedinLabel') : t('messages.uploadedLabel')}
                            </Badge>
                            
                            {candidate.skills && candidate.skills.length > 0 && (
                              <>
                                {candidate.skills.slice(0, 3).map((skill, skillIndex) => (
                                  <Badge key={skillIndex} variant="outline" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                 {candidate.skills.length > 3 && (
                                   <Badge variant="outline" className="text-xs text-muted-foreground">
                                     +{candidate.skills.length - 3} {t('messages.more')}
                                   </Badge>
                                 )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2 lg:flex-col lg:items-stretch lg:w-32">
                        <Button 
                          variant="default"
                          size="sm"
                          onClick={() => handleViewCandidate(candidate)}
                          className="flex-1 lg:flex-none"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Детали
                        </Button>
                        
                        <div className="flex gap-1">
                          {candidate.source === 'linkedin_search' && candidate.ai_analysis?.linkedin_url && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              asChild
                              className="text-muted-foreground hover:text-blue-600"
                            >
                               <a 
                                 href={candidate.ai_analysis.linkedin_url} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 title={t('messages.viewLinkedinProfile')}
                               >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                          
                          {candidate.source === 'hh_search' && candidate.ai_analysis?.hh_url && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              asChild
                              className="text-muted-foreground hover:text-brand"
                            >
                               <a 
                                 href={candidate.ai_analysis.hh_url} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 title={t('messages.viewOnHH')}
                               >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                             <AlertDialogContent>
                               <AlertDialogHeader>
                                 <AlertDialogTitle>{t('messages.deleteCandidate')}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {candidate.source === 'upload' 
                                      ? t('messages.deleteCandidateConfirmWithResume', { name: candidate.name })
                                      : t('messages.deleteCandidateConfirmWithoutResume', { name: candidate.name })
                                    }
                                  </AlertDialogDescription>
                               </AlertDialogHeader>
                               <AlertDialogFooter>
                                 <AlertDialogCancel>{t('buttons.cancel')}</AlertDialogCancel>
                                 <AlertDialogAction
                                   onClick={() => handleDeleteCandidate(candidate.id)}
                                   className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                 >
                                   {t('buttons.delete')}
                                 </AlertDialogAction>
                               </AlertDialogFooter>
                             </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Connected Status */}
        {candidates.length > 0 && (
          <Card className="bg-gradient-to-r from-success/5 to-emerald-500/5 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                 <div>
                   <h4 className="font-semibold text-success">
                     {t('messages.liveDatabaseConnected')}
                   </h4>
                   <p className="text-sm text-success/80">
                     {t('messages.displayingCandidates', { count: candidates.length })}
                   </p>
                 </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <CandidateDetailModal
        candidate={selectedCandidate}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedCandidate(null);
        }}
      />
    </>
  );
};

export default CandidateTable;
