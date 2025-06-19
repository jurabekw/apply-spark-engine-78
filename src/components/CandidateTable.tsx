
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, Download, Star, Eye } from 'lucide-react';

const CandidateTable = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Sample data - in production this would come from your database
  const candidates = [
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      position: 'Senior Frontend Developer',
      score: 92,
      status: 'Strong Fit',
      experience: '6 years',
      skills: ['React', 'TypeScript', 'Node.js'],
      submittedAt: '2024-01-15',
    },
    {
      id: 2,
      name: 'Michael Chen',
      email: 'm.chen@email.com',
      position: 'Full Stack Engineer',
      score: 87,
      status: 'Good Match',
      experience: '4 years',
      skills: ['Vue.js', 'Python', 'AWS'],
      submittedAt: '2024-01-14',
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      email: 'emily.r@email.com',
      position: 'UI/UX Designer',
      score: 78,
      status: 'Average',
      experience: '3 years',
      skills: ['Figma', 'Sketch', 'CSS'],
      submittedAt: '2024-01-13',
    },
    {
      id: 4,
      name: 'David Kim',
      email: 'd.kim@email.com',
      position: 'Backend Developer',
      score: 65,
      status: 'Below Average',
      experience: '2 years',
      skills: ['Java', 'Spring', 'MySQL'],
      submittedAt: '2024-01-12',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Strong Fit':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Good Match':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Average':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Below Average':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 font-semibold';
    if (score >= 70) return 'text-blue-600 font-semibold';
    if (score >= 60) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  const filteredCandidates = candidates.filter(candidate =>
    candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Candidate Database</h2>
          <p className="text-gray-600">Manage and review all candidate submissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline">
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
                    <TableCell className="font-medium">{candidate.position}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={getScoreColor(candidate.score)}>
                          {candidate.score}%
                        </span>
                        {candidate.score >= 85 && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(candidate.status)}>
                        {candidate.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{candidate.experience}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
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
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {candidate.submittedAt}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="font-semibold text-blue-900 mb-2">
              Demo Data Displayed
            </h3>
            <p className="text-sm text-blue-700">
              This table shows sample candidate data. Connect Supabase to store and manage real candidate information with full CRUD operations.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CandidateTable;
