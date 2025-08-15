import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Eye, RotateCcw, Search, Trash } from 'lucide-react';
import { useLinkedinSearchHistory } from '@/hooks/useLinkedinSearchHistory';
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { LinkedinSearchResultsModal } from './LinkedinSearchResultsModal';

interface LinkedinSearchHistoryProps {
  onRerunSearch?: (search: { job_title: string; required_skills: string; experience_level: string }) => void;
}

const getExperienceLevelLabel = (level: string): string => {
  switch (level) {
    case 'junior': return 'Junior (0-2 years)';
    case 'mid': return 'Mid-level (2-5 years)';
    case 'senior': return 'Senior (5+ years)';
    default: return level || 'Not specified';
  }
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const LinkedinSearchHistory: React.FC<LinkedinSearchHistoryProps> = ({ onRerunSearch }) => {
  const { searches, loading, deleteSearch, deleteAllSearches } = useLinkedinSearchHistory();
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedSearch, setSelectedSearch] = useState<any>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);

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
    setShowResultsModal(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>LinkedIn Search History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredSearches = searches.filter(search =>
    search.job_title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    search.required_skills.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>LinkedIn Search History</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search history..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              {searches.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Trash className="h-4 w-4" />
                      Clear All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear All LinkedIn Search History</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all your LinkedIn search history. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteAllSearches} className="bg-red-600 hover:bg-red-700">
                        Delete All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSearches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searches.length === 0 ? "No LinkedIn searches yet." : "No searches match your filter."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Skills</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Results</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSearches.map((search) => (
                    <TableRow key={search.id}>
                      <TableCell className="font-medium">{search.job_title}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={search.required_skills}>
                          {search.required_skills}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getExperienceLevelLabel(search.experience_level)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {search.candidate_count} candidates
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(search.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewResults(search)}
                            className="gap-1"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {onRerunSearch && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRerunSearch(search)}
                              className="gap-1"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteSearch(search.id)}
                            className="gap-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      <LinkedinSearchResultsModal
        isOpen={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        search={selectedSearch}
      />
    </>
  );
};