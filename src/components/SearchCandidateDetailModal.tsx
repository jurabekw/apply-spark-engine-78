import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import React from 'react';

interface SearchCandidateDetailModalProps {
  candidate: {
    title?: string;
    AI_score?: string;
    experience?: string;
    education_level?: string;
    key_skills?: string[];
    alternate_url?: string;
    score_reasoning?: string;
    strengths?: string[];
    areas_for_improvement?: string[];
    recommendations?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

const SearchCandidateDetailModal: React.FC<SearchCandidateDetailModalProps> = ({ candidate, isOpen, onClose }) => {
  const score = candidate?.AI_score ? (parseInt(candidate.AI_score.match(/\d{1,3}/)?.[0] || '0', 10) || 0) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3">
            <span>{candidate?.title || 'Candidate details'}</span>
            {candidate?.alternate_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={candidate.alternate_url} target="_blank" rel="noopener noreferrer">
                  Open Profile <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <section>
            <div className="text-sm text-muted-foreground">AI Score</div>
            <div className="mt-1 text-lg font-semibold">{score}%</div>
          </section>

          <section>
            <div className="text-sm text-muted-foreground">Experience</div>
            <div className="mt-1">{candidate?.experience || '—'}</div>
          </section>

          <section>
            <div className="text-sm text-muted-foreground">Education</div>
            <div className="mt-1">{candidate?.education_level || '—'}</div>
          </section>

          {candidate?.key_skills && candidate.key_skills.length > 0 && (
            <section>
              <div className="text-sm text-muted-foreground mb-2">Key skills</div>
              <div className="flex flex-wrap gap-2">
                {candidate.key_skills.map((s, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {candidate?.score_reasoning && (
            <section>
              <div className="text-sm text-muted-foreground">Score reasoning</div>
              <p className="mt-1 text-sm leading-relaxed">{candidate.score_reasoning}</p>
            </section>
          )}

          {(candidate?.strengths?.length || 0) > 0 && (
            <section>
              <div className="text-sm text-muted-foreground">Strengths</div>
              <ul className="mt-1 list-disc pl-5 text-sm space-y-1">
                {candidate!.strengths!.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </section>
          )}

          {(candidate?.areas_for_improvement?.length || 0) > 0 && (
            <section>
              <div className="text-sm text-muted-foreground">Areas for improvement</div>
              <ul className="mt-1 list-disc pl-5 text-sm space-y-1">
                {candidate!.areas_for_improvement!.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </section>
          )}

          {candidate?.recommendations && (
            <section>
              <div className="text-sm text-muted-foreground">Recommendation</div>
              <div className="mt-1 font-medium capitalize">{String(candidate.recommendations).replace('_', ' ')}</div>
            </section>
          )}

          <div className="pt-2">
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchCandidateDetailModal;
