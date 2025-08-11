import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, Download, Star, ExternalLink } from 'lucide-react';

interface Candidate {
  title: string;
  experience: string;
  education_level: string;
  AI_score: string;
  key_skills: string[];
  alternate_url: string;
}

interface ResumeSearchTableProps {
  candidates: Candidate[];
  loading?: boolean;
}

const ResumeSearchTable = ({ candidates, loading }: ResumeSearchTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredCandidates = candidates.filter(candidate => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const title = (candidate.title || '').toLowerCase();
    const experience = (candidate.experience || '').toLowerCase();
    const skills = candidate.key_skills || [];
    
    return title.includes(searchLower) ||
           experience.includes(searchLower) ||
           skills.some(skill => (skill || '').toLowerCase().includes(searchLower));
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading search results...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Search Results ({filteredCandidates.length})</CardTitle>
          <div className="flex gap-2">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredCandidates.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Search className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                No candidates found
              </h3>
              <p>
                {candidates.length === 0 
                  ? "Run a search to find matching candidates from HH.ru"
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
                  <TableHead>AI Score</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Education</TableHead>
                  <TableHead>Key Skills</TableHead>
                  <TableHead>Resume</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.map((candidate, index) => {
                  const score = parseScore(candidate.AI_score);
                  // Create unique key using multiple candidate properties
                  const uniqueKey = `${candidate.alternate_url || candidate.title}-${index}`;
                  return (
                    <TableRow key={uniqueKey} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="font-medium">{candidate.title}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={getScoreColor(score)}>
                            {score}%
                          </span>
                          {score >= 85 && (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {candidate.experience || 'Not specified'}
                      </TableCell>
                      <TableCell>
                        {candidate.education_level || 'Not specified'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {candidate.key_skills.slice(0, 3).map((skill, skillIndex) => (
                            <Badge key={skillIndex} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {candidate.key_skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{candidate.key_skills.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          asChild
                        >
                          <a 
                            href={candidate.alternate_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            title="View profile on HH.ru"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResumeSearchTable;