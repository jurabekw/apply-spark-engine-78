import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useState } from 'react';
import CandidateDetailModal from './CandidateDetailModal';

interface BatchHistoryModalProps {
  batch: any;
  isOpen: boolean;
  onClose: () => void;
}

const BatchHistoryModal = ({ batch, isOpen, onClose }: BatchHistoryModalProps) => {
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [isCandidateDetailOpen, setIsCandidateDetailOpen] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const handleViewCandidate = (candidate: any) => {
    setSelectedCandidate(candidate);
    setIsCandidateDetailOpen(true);
  };

  if (!batch) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Batch Analysis: {batch.job_title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <h4 className="font-semibold">Job Title</h4>
                <p className="text-sm text-muted-foreground">{batch.job_title}</p>
              </div>
              <div>
                <h4 className="font-semibold">Total Candidates</h4>
                <p className="text-sm text-muted-foreground">{batch.total_candidates}</p>
              </div>
              <div className="col-span-2">
                <h4 className="font-semibold">Job Requirements</h4>
                <p className="text-sm text-muted-foreground">{batch.job_requirements}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Candidates ({batch.candidates?.length || 0})</h4>
              {batch.candidates && batch.candidates.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Filename</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>AI Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batch.candidates.map((candidate: any) => (
                      <TableRow key={candidate.id}>
                        <TableCell className="font-medium">{candidate.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {candidate.original_filename}
                        </TableCell>
                        <TableCell className="text-sm">
                          {candidate.email || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {typeof candidate.ai_score === 'number' ? (
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${getScoreColor(candidate.ai_score)}`}
                            >
                              {candidate.ai_score}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {candidate.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewCandidate(candidate)}
                            title="View candidate details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No candidates found in this batch.
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CandidateDetailModal
        candidate={selectedCandidate}
        isOpen={isCandidateDetailOpen}
        onClose={() => setIsCandidateDetailOpen(false)}
      />
    </>
  );
};

export default BatchHistoryModal;