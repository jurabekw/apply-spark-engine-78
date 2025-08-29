import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Search, Filter, Download, Eye } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import SearchCandidateDetailModal from './SearchCandidateDetailModal';
import { useTranslation } from 'react-i18next';

interface Candidate {
  title: string;
  experience: string;
  AI_score: string;
  key_skills: string[];
  alternate_url?: string;
  [key: string]: any;
}

interface LinkedinSearchTableProps {
  candidates: Candidate[];
  loading?: boolean;
}

export const LinkedinSearchTable: React.FC<LinkedinSearchTableProps> = ({ 
  candidates = [], 
  loading = false 
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [minScore, setMinScore] = useState([0]);
  const [onlyWithUrl, setOnlyWithUrl] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const parseScore = (score: string): number => {
    if (typeof score === 'number') return score;
    const parsed = parseFloat(score);
    return isNaN(parsed) ? 0 : parsed;
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 bg-green-100";
    if (score >= 6) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const handleExport = () => {
    const csvContent = [
      ['Name', 'AI Score', 'Experience', 'Key Skills', 'LinkedIn URL'].join(','),
      ...filteredCandidates.map(candidate => [
        candidate.title || '',
        parseScore(candidate.AI_score),
        candidate.experience || '',
        Array.isArray(candidate.key_skills) ? candidate.key_skills.join('; ') : '',
        candidate.alternate_url || ''
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `linkedin_candidates_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = searchTerm === '' || 
      candidate.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(candidate.key_skills) && candidate.key_skills.some(skill => 
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    
    const score = parseScore(candidate.AI_score);
    const matchesScore = score >= minScore[0];
    const matchesUrl = !onlyWithUrl || (candidate.alternate_url && candidate.alternate_url.trim() !== '');
    
    return matchesSearch && matchesScore && matchesUrl;
  });

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-full" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <h3 className="text-lg font-semibold">LinkedIn {t('messages.searchResults')} ({filteredCandidates.length})</h3>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t('placeholders.searchResults')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    {t('buttons.filter')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div>
                      <Label>{t('labels.minimumAiScore')}: {minScore[0]}</Label>
                      <Slider
                        value={minScore}
                        onValueChange={setMinScore}
                        max={10}
                        min={0}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="linkedin-url"
                        checked={onlyWithUrl}
                        onCheckedChange={(checked) => setOnlyWithUrl(checked as boolean)}
                      />
                      <Label htmlFor="linkedin-url">{t('labels.onlyWithLinkedinUrl')}</Label>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {filteredCandidates.length > 0 && (
                <Button onClick={handleExport} variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  {t('buttons.exportCsv')}
                </Button>
              )}
            </div>
          </div>

          {filteredCandidates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {candidates.length === 0 ? t('messages.noCandidatesFound') : t('messages.noCandidatesMatch')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('tableHeaders.candidate')}</TableHead>
                    <TableHead>{t('tableHeaders.aiScore')}</TableHead>
                    <TableHead>{t('tableHeaders.experience')}</TableHead>
                    <TableHead>{t('tableHeaders.keySkills')}</TableHead>
                    <TableHead>{t('tableHeaders.linkedinProfile')}</TableHead>
                    <TableHead>{t('tableHeaders.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidates.map((candidate, index) => {
                    const score = parseScore(candidate.AI_score);
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {candidate.title || t('messages.na')}
                        </TableCell>
                        <TableCell>
                          <Badge className={getScoreColor(score)}>
                            {score.toFixed(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{candidate.experience || t('messages.na')}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(candidate.key_skills) && candidate.key_skills.slice(0, 3).map((skill, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {Array.isArray(candidate.key_skills) && candidate.key_skills.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{candidate.key_skills.length - 3} {t('messages.more')}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {candidate.alternate_url ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="text-blue-600 hover:text-blue-800 p-0 h-auto"
                            >
                              <a 
                                href={candidate.alternate_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1"
                              >
                                {t('buttons.viewProfile')}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                          ) : (
                            <span className="text-gray-400">{t('messages.notAvailable')}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCandidate(candidate)}
                            className="gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            {t('buttons.view')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </Card>

      <SearchCandidateDetailModal
        isOpen={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        candidate={selectedCandidate}
      />
    </>
  );
};