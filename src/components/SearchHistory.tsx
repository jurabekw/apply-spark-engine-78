
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Search, Eye, Trash2, Clock } from 'lucide-react';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import SearchResultsModal from './SearchResultsModal';

interface SearchHistoryProps {
  onRerunSearch?: (search: { job_title: string; required_skills: string; experience_level: string }) => void;
}

const SearchHistory = ({ onRerunSearch }: SearchHistoryProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { searches, loading, deleteSearch } = useSearchHistory();

  // State to handle viewing saved results
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [selectedSearch, setSelectedSearch] = useState<any>(null);

  const getExperienceLevelLabel = (level: string) => {
    const labels = {
      'noExperience': 'No Experience',
      'between1And3': '1-3 Years',
      'between3And6': '3-6 Years',
      'moreThan6': '6+ Years'
    };
    return labels[level as keyof typeof labels] || level;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredSearches = searches.filter(search =>
    search.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    search.required_skills.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRerunSearch = (search: any) => {
    if (onRerunSearch) {
      onRerunSearch({
        job_title: search.job_title,
        required_skills: search.required_skills,
        experience_level: search.experience_level
      });
    }
  };

  const handleViewResults = (search: any) => {
    setSelectedSearch(search);
    setIsResultsOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading search history...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <CardTitle>Search History ({filteredSearches.length})</CardTitle>
            </div>
            {searches.length > 0 && (
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search history..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredSearches.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                {searches.length === 0 ? 'No search history yet' : 'No matching searches'}
              </h3>
              <p className="text-muted-foreground text-sm">
                {searches.length === 0 
                  ? "Your search history will appear here after you run your first search."
                  : "Try adjusting your search terms."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Required Skills</TableHead>
                    <TableHead>Experience Level</TableHead>
                    <TableHead>Results</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSearches.map((search) => (
                    <TableRow key={search.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="font-medium">{search.job_title}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {search.required_skills.split(',').slice(0, 3).map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {skill.trim()}
                            </Badge>
                          ))}
                          {search.required_skills.split(',').length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{search.required_skills.split(',').length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getExperienceLevelLabel(search.experience_level)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{search.candidate_count}</span> candidates
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(search.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewResults(search)}
                            title="View saved results"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Search History</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this search history entry? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteSearch(search.id)}
                                  className="bg-destructive hover:bg-destructive/90"
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

      <SearchResultsModal
        isOpen={isResultsOpen}
        search={selectedSearch}
        onClose={() => setIsResultsOpen(false)}
      />
    </>
  );
};

export default SearchHistory;
