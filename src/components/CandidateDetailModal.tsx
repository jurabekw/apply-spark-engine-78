
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Eye, Download, X } from 'lucide-react';
import { Candidate } from '@/hooks/useCandidates';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CandidateDetailModalProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
}

const CandidateDetailModal = ({ candidate, isOpen, onClose }: CandidateDetailModalProps) => {
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
        title: "No resume file",
        description: "This candidate doesn't have an uploaded resume file.",
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
        title: "Error loading resume",
        description: "Could not load the resume file. Please try again.",
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
            <span>Candidate Details - {candidate.name}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{candidate.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{candidate.email || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{candidate.phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Position</p>
                <p className="font-medium">{candidate.position || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Experience</p>
                <p className="font-medium">
                  {candidate.experience_years ? `${candidate.experience_years} years` : 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Source</p>
                <Badge variant="outline">{candidate.source}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis & Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                AI Analysis & Score
                <Badge className={getScoreColor(candidate.ai_score)}>
                  {candidate.ai_score ? `${candidate.ai_score}%` : 'N/A'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {candidate.ai_score && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Match Score</p>
                  <Progress value={candidate.ai_score} className="h-3" />
                  <p className="text-xs text-gray-500 mt-1">
                    {candidate.ai_score}% match based on job requirements
                  </p>
                </div>
              )}

              {candidate.ai_analysis && (
                <div className="space-y-4">
                  {candidate.ai_analysis.match_reasoning && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Score Reasoning</p>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        {candidate.ai_analysis.match_reasoning}
                      </p>
                    </div>
                  )}

                  {candidate.ai_analysis.strengths && candidate.ai_analysis.strengths.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-green-700 mb-2">Strengths</p>
                      <ul className="list-disc list-inside space-y-1">
                        {candidate.ai_analysis.strengths.map((strength: string, index: number) => (
                          <li key={index} className="text-sm text-green-600">{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {candidate.ai_analysis.weaknesses && candidate.ai_analysis.weaknesses.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-red-700 mb-2">Areas for Improvement</p>
                      <ul className="list-disc list-inside space-y-1">
                        {candidate.ai_analysis.weaknesses.map((weakness: string, index: number) => (
                          <li key={index} className="text-sm text-red-600">{weakness}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {candidate.ai_analysis.recommendations && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Recommendations</p>
                      <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                        {candidate.ai_analysis.recommendations}
                      </p>
                    </div>
                  )}

                  {candidate.ai_analysis.language_notes && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Language Notes</p>
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
                <CardTitle>Skills</CardTitle>
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
                  <CardTitle>Education</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{candidate.education}</p>
                </CardContent>
              </Card>
            )}

            {candidate.work_history && (
              <Card>
                <CardHeader>
                  <CardTitle>Work History</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{candidate.work_history}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Resume Document */}
          {candidate.resume_file_path && (
            <Card>
              <CardHeader>
                <CardTitle>Resume Document</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">
                      Original filename: {candidate.original_filename || 'Resume.pdf'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Uploaded on {new Date(candidate.created_at).toLocaleDateString()}
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
                        Loading...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        View Resume
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
