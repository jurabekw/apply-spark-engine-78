
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Search, Download, Star, Eye, Loader2, Trash2, ExternalLink } from 'lucide-react';
import { useCandidates } from '@/hooks/useCandidates';
import CandidateDetailModal from './CandidateDetailModal';

const CandidateTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'upload' | 'hh_search'>('all');
  const { candidates, loading, updateCandidateStatus, deleteCandidate, refetch } = useCandidates();

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'shortlisted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'interviewed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'reviewing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'hired':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default: // 'new'
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number | undefined) => {
    if (!score) return 'text-gray-400';
    if (score >= 85) return 'text-green-600 font-semibold';
    if (score >= 70) return 'text-blue-600 font-semibold';
    if (score >= 60) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'new': 'New',
      'reviewing': 'Reviewing',
      'shortlisted': 'Shortlisted',
      'interviewed': 'Interviewed',
      'hired': 'Hired',
      'rejected': 'Rejected'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const term = searchTerm.toLowerCase();
  const filteredCandidates = candidates.filter(candidate => {
    // Source filter
    if (sourceFilter !== 'all') {
      if (sourceFilter === 'upload' && candidate.source !== 'upload') return false;
      if (sourceFilter === 'hh_search' && candidate.source !== 'hh_search') return false;
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
      source: c.source === 'hh_search' ? 'HH.ru' : 'Upload',
      submitted_at: c.submitted_at || c.created_at,
      hh_url: (c as any).ai_analysis?.hh_url ?? ''
    }));

    const headers = ['Name','Email','Phone','Position','AI Score','Experience Years','Skills','Source','Submitted At','HH URL'];
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Candidate Database</h2>
            <p className="text-gray-600">Manage and review all candidate submissions</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <span className="ml-2 text-gray-600">Loading candidates...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Candidate Database</h2>
            <p className="text-gray-600">Manage and review all candidate submissions</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-md border p-1">
              <Button variant={sourceFilter === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setSourceFilter('all')}>All</Button>
              <Button variant={sourceFilter === 'upload' ? 'default' : 'ghost'} size="sm" onClick={() => setSourceFilter('upload')}>Uploaded</Button>
              <Button variant={sourceFilter === 'hh_search' ? 'default' : 'ghost'} size="sm" onClick={() => setSourceFilter('hh_search')}>HH</Button>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredCandidates.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>All Candidates ({filteredCandidates.length})</CardTitle>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search candidates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredCandidates.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="w-16 h-16 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    No candidates found
                  </h3>
                  <p className="text-gray-500">
                    {candidates.length === 0 
                      ? "Upload some resumes to get started with AI-powered candidate screening."
                      : "Try adjusting your search terms."
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>AI Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Key Skills</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCandidates.map((candidate) => (
                      <TableRow key={candidate.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">{candidate.name}</div>
                            <div className="text-sm text-gray-500">{candidate.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {candidate.position || 'Not specified'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={getScoreColor(candidate.ai_score)}>
                              {candidate.ai_score ? `${candidate.ai_score}%` : 'N/A'}
                            </span>
                            {candidate.ai_score && candidate.ai_score >= 85 && (
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(candidate.status)}>
                            {getStatusLabel(candidate.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {candidate.experience_years ? `${candidate.experience_years} years` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {candidate.skills && candidate.skills.length > 0 ? (
                              <>
                                {candidate.skills.slice(0, 2).map((skill, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                {candidate.skills.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{candidate.skills.length - 2}
                                  </Badge>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-400 text-sm">No skills listed</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={candidate.source === 'hh_search' ? 'default' : 'secondary'}
                            className={candidate.source === 'hh_search' ? 'bg-blue-100 text-blue-800' : ''}
                          >
                            {candidate.source === 'hh_search' ? 'HH.ru' : 'Upload'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(candidate.submitted_at || candidate.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewCandidate(candidate)}
                              title="View candidate details, AI analysis, and resume"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {candidate.source === 'hh_search' && candidate.ai_analysis?.hh_url && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                asChild
                                title="View profile on HH.ru"
                              >
                                <a 
                                  href={candidate.ai_analysis.hh_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
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
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Candidate</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {candidate.name}? This action cannot be undone and will permanently remove all candidate data{candidate.source === 'upload' ? ' including their resume' : ''}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteCandidate(candidate.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {candidates.length > 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="font-semibold text-green-900 mb-2">
                  Real Data Connected
                </h3>
                <p className="text-sm text-green-700">
                  This table shows actual candidate data from your database. Click the eye icon to view detailed AI analysis, 
                  score reasoning, and resume documents for each candidate.
                </p>
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
