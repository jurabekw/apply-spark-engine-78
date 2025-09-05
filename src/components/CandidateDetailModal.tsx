
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Eye, Download, X, Linkedin } from 'lucide-react';
import { Candidate } from '@/hooks/useCandidates';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface CandidateDetailModalProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
}

const CandidateDetailModal = ({ candidate, isOpen, onClose }: CandidateDetailModalProps) => {
  const { t } = useTranslation();
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [loadingResume, setLoadingResume] = useState(false);
  const { toast } = useToast();

  if (!candidate) return null;

  const getScoreColor = (score: number | undefined) => {
    if (!score) return 'text-gray-400';
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleViewResume = async () => {
    if (!candidate.resume_file_path) {
      toast({
        title: t('messages.noResumeFile'),
        description: t('messages.noResumeDescription'),
        variant: "destructive",
      });
      return;
    }

    setLoadingResume(true);
    try {
      const { data, error } = await supabase.storage
        .from('resumes')
        .createSignedUrl(candidate.resume_file_path, 3600); // 1 hour expiry

      if (error) throw error;
      
      setResumeUrl(data.signedUrl);
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Error loading resume:', error);
      toast({
        title: t('messages.errorLoadingResume'),
        description: t('messages.errorLoadingResumeDescription'),
        variant: "destructive",
      });
    } finally {
      setLoadingResume(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{t('messages.candidateDetails')} - {candidate.name}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('labels.basicInformation')}</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">{t('labels.name')}</p>
                <p className="font-medium">{candidate.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('labels.email')}</p>
                <p className="font-medium">{candidate.email || t('messages.notProvided')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('labels.phone')}</p>
                <p className="font-medium">{candidate.phone || t('messages.notProvided')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('labels.position')}</p>
                <p className="font-medium">{candidate.position || t('messages.notSpecified')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('labels.experience')}</p>
                <p className="font-medium">
                  {candidate.experience_years ? `${candidate.experience_years} ${t('messages.years')}` : t('messages.notSpecified')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('labels.source')}</p>
                <Badge variant="outline">{candidate.source}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis & Score */}
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {t('messages.aiScore')} & {t('messages.scoreReasoning')}
                <Badge className={getScoreColor(candidate.ai_score)}>
                  {candidate.ai_score ? `${candidate.ai_score}%` : 'N/A'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {candidate.ai_score && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">{t('labels.matchScore')}</p>
                  <Progress value={candidate.ai_score} className="h-3" />
                  <p className="text-xs text-gray-500 mt-1">
                    {candidate.ai_score}% {t('messages.matchBasedOnRequirements')}
                  </p>
                </div>
              )}

              {candidate.ai_analysis && (
                <div className="space-y-4">
                  {candidate.ai_analysis.match_reasoning && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">{t('messages.scoreReasoning')}</p>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        {candidate.ai_analysis.match_reasoning}
                      </p>
                    </div>
                  )}

                  {candidate.ai_analysis.strengths && candidate.ai_analysis.strengths.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-green-700 mb-2">{t('messages.strengths')}</p>
                      <ul className="list-disc list-inside space-y-1">
                        {candidate.ai_analysis.strengths.map((strength: string, index: number) => (
                          <li key={index} className="text-sm text-green-600">{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {candidate.ai_analysis.weaknesses && candidate.ai_analysis.weaknesses.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-red-700 mb-2">{t('messages.areasForImprovement')}</p>
                      <ul className="list-disc list-inside space-y-1">
                        {candidate.ai_analysis.weaknesses.map((weakness: string, index: number) => (
                          <li key={index} className="text-sm text-red-600">{weakness}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {candidate.ai_analysis.recommendations && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">{t('messages.recommendations')}</p>
                      <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                        {candidate.ai_analysis.recommendations}
                      </p>
                    </div>
                  )}

                  {candidate.ai_analysis.language_notes && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">{t('messages.languageNotes')}</p>
                      <p className="text-sm text-gray-600">
                        {candidate.ai_analysis.language_notes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skills */}
          {candidate.skills && candidate.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('messages.skills')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Education & Work History */}
          <div className="grid md:grid-cols-2 gap-4">
            {candidate.education && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('messages.education')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{candidate.education}</p>
                </CardContent>
              </Card>
            )}

            {candidate.work_history && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('messages.workHistory')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{candidate.work_history}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Profile Links */}
          {((candidate.source === 'linkedin_search' && candidate.ai_analysis?.linkedin_url) || 
            (candidate.source === 'hh_search' && candidate.ai_analysis?.hh_url)) && (
            <Card>
              <CardHeader>
                <CardTitle>{t('messages.profileLinks')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {candidate.source === 'linkedin_search' && candidate.ai_analysis?.linkedin_url && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                          <Linkedin className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{t('messages.linkedinProfile')}</p>
                          <p className="text-sm text-gray-500">{t('messages.viewFullLinkedinProfile')}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => window.open(candidate.ai_analysis?.linkedin_url, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        {t('messages.viewProfile')}
                      </Button>
                    </div>
                  )}
                  
                  {candidate.source === 'hh_search' && candidate.ai_analysis?.hh_url && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-red-100 text-red-600">
                          <span className="text-sm font-bold">HH</span>
                        </div>
                        <div>
                          <p className="font-medium">{t('messages.hhProfile')}</p>
                          <p className="text-sm text-gray-500">{t('messages.viewFullHhProfile')}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => window.open(candidate.ai_analysis?.hh_url, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        {t('messages.viewProfile')}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resume Document */}
          {candidate.resume_file_path && (
            <Card>
              <CardHeader>
                <CardTitle>{t('messages.resumeDocument')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">
                      {t('messages.originalFilename')}: {candidate.original_filename || 'Resume.pdf'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('messages.uploadedOn')} {new Date(candidate.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    onClick={handleViewResume}
                    disabled={loadingResume}
                    className="flex items-center gap-2"
                  >
                    {loadingResume ? (
                      <>
                        <div className="w-4 h-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                        {t('loading.loading')}
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        {t('messages.viewResume')}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CandidateDetailModal;
