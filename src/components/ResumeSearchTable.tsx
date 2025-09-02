import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, Download, Star, ExternalLink } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import SearchCandidateDetailModal from './SearchCandidateDetailModal';
import { useTranslation } from 'react-i18next';
interface Candidate {
  title: string;
  experience: string;
  education_level: string;
  AI_score: string;
  key_skills: string[];
  alternate_url: string;
  score_reasoning?: string;
  strengths?: string[];
  areas_for_improvement?: string[];
  recommendations?: string;
}
interface ResumeSearchTableProps {
  candidates: Candidate[];
  loading?: boolean;
}
const ResumeSearchTable = ({
  candidates,
  loading
}: ResumeSearchTableProps) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [onlyWithUrl, setOnlyWithUrl] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const parseScore = (score: string): number => {
    const m = score.match(/\d{1,3}/);
    if (!m) return 0;
    return Math.min(100, parseInt(m[0]!, 10));
  };
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 font-semibold';
    if (score >= 70) return 'text-blue-600 font-semibold';
    if (score >= 60) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };
  const escapeCSV = (val: any) => {
    const s = String(val ?? '');
    if (/[",\n]/.test(s)) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const handleExport = () => {
    const rows = filteredCandidates.map(c => ({
      title: c.title,
      ai_score: parseScore(c.AI_score),
      experience: c.experience,
      education: c.education_level,
      key_skills: (c.key_skills || []).join('; '),
      url: c.alternate_url,
      score_reasoning: c.score_reasoning || '',
      strengths: (c.strengths || []).join('; '),
      areas_for_improvement: (c.areas_for_improvement || []).join('; '),
      recommendations: c.recommendations || '',
    }));
    const headers = ['Title', 'AI Score', 'Experience', 'Education', 'Key Skills', 'URL', 'Score Reasoning', 'Strengths', 'Areas for Improvement', 'Recommendations'];
    const csv = [
      headers.join(','),
      ...rows.map(r => [
        escapeCSV(r.title),
        r.ai_score,
        escapeCSV(r.experience),
        escapeCSV(r.education),
        escapeCSV(r.key_skills),
        escapeCSV(r.url),
        escapeCSV(r.score_reasoning),
        escapeCSV(r.strengths),
        escapeCSV(r.areas_for_improvement),
        escapeCSV(r.recommendations)
      ].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'candidates.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const filteredCandidates = candidates.filter(candidate => {
    // Text search
    const searchLower = searchTerm.toLowerCase();
    const title = (candidate.title || '').toLowerCase();
    const experience = (candidate.experience || '').toLowerCase();
    const skills = candidate.key_skills || [];
    const passesSearch = !searchTerm ? true : title.includes(searchLower) || experience.includes(searchLower) || skills.some(skill => (skill || '').toLowerCase().includes(searchLower));

    // Filters
    const score = parseScore(candidate.AI_score);
    if (score < minScore) return false;
    if (onlyWithUrl && !candidate.alternate_url) return false;
    return passesSearch;
  });
  if (loading) {
    return <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">{t('messages.loadingSearchResults')}</span>
          </div>
        </CardContent>
      </Card>;
  }
  return <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{t('messages.searchResults')} ({filteredCandidates.length})</CardTitle>
          <div className="flex gap-2">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder={t('placeholders.searchResults')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  {t('buttons.filter')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="end">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-2">{t('filters.minimumAiScore')}: {minScore}%</div>
                    <Slider value={[minScore]} onValueChange={v => setMinScore(v[0] ?? 0)} min={0} max={100} step={5} />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => {
                    setMinScore(0);
                    setOnlyWithUrl(false);
                  }}>{t('buttons.reset')}</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              {t('buttons.export')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredCandidates.length === 0 ? <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Search className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {t('messages.noCandidatesFound')}
              </h3>
              <p>
                {candidates.length === 0 ? t('messages.runSearchDescription') : t('messages.candidatesTryAdjusting')}
              </p>
            </div>
          </div> : <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('tableHeaders.candidate')}</TableHead>
                  <TableHead>{t('tableHeaders.aiScore')}</TableHead>
                  <TableHead>{t('tableHeaders.experience')}</TableHead>
                  <TableHead>{t('tableHeaders.education')}</TableHead>
                  <TableHead>{t('tableHeaders.keySkills')}</TableHead>
                  <TableHead>{t('tableHeaders.resume')}</TableHead>
                  <TableHead>{t('tableHeaders.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.map((candidate, index) => {
              const score = parseScore(candidate.AI_score);
              // Create unique key using multiple candidate properties
              const uniqueKey = `${candidate.alternate_url || candidate.title}-${index}`;
              return <TableRow key={uniqueKey} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="font-medium">{candidate.title}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={getScoreColor(score)}>
                            {score}%
                          </span>
                          {score >= 85 && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        {candidate.experience || t('messages.notSpecified')}
                      </TableCell>
                      <TableCell>
                        {candidate.education_level || t('messages.notSpecified')}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {candidate.key_skills.slice(0, 3).map((skill, skillIndex) => <Badge key={skillIndex} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>)}
                          {candidate.key_skills.length > 3 && <Badge variant="outline" className="text-xs">
                              +{candidate.key_skills.length - 3}
                            </Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={candidate.alternate_url} target="_blank" rel="noopener noreferrer" title={t('resumeSearchPage.viewProfileOnHhRu')}>
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => setSelectedCandidate(candidate)}>
                          {t('buttons.view')}
                        </Button>
                      </TableCell>
                    </TableRow>;
            })}
              </TableBody>
            </Table>
          </div>}
      </CardContent>
      <SearchCandidateDetailModal
        candidate={selectedCandidate as any}
        isOpen={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
      />
    </Card>;
  };
  export default ResumeSearchTable;