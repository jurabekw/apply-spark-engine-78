import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Search, Eye, Trash2, Clock, FileText, Trash, Users } from 'lucide-react';
import { useBatchHistory } from '@/hooks/useBatchHistory';
import BatchHistoryModal from './BatchHistoryModal';
import { useTranslation } from 'react-i18next';

const AnalysisHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { batches, loading, deleteBatch, deleteAllBatches } = useBatchHistory();
  const { t } = useTranslation();
  
  // State to handle viewing batch details
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const filteredBatches = batches.filter(batch =>
    batch.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.job_requirements.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewBatch = (batch: any) => {
    setSelectedBatch(batch);
    setIsBatchModalOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">{t('analysisHistory.loadingHistory')}</span>
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
              <Users className="w-5 h-5 text-muted-foreground" />
              <CardTitle>{t('analysisHistory.title')}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {batches.length > 0 && (
                <>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="gap-2">
                        <Trash className="w-4 h-4" />
                        {t('analysisHistory.deleteAll')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('analysisHistory.deleteAllTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('analysisHistory.deleteAllDescription', { count: batches.length })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('analysisHistory.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={deleteAllBatches}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          {t('analysisHistory.delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder={t('placeholders.searchHistory')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredBatches.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                {batches.length === 0 ? t('analysisHistory.noBatchHistory') : t('analysisHistory.noMatchingBatches')}
              </h3>
              <p className="text-muted-foreground text-sm">
                {batches.length === 0 
                  ? t('analysisHistory.noBatchHistoryDescription')
                  : t('analysisHistory.adjustSearchTerms')
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('analysisHistory.jobTitle')}</TableHead>
                    <TableHead>{t('analysisHistory.candidates')}</TableHead>
                    <TableHead>{t('analysisHistory.jobRequirements')}</TableHead>
                    <TableHead>{t('analysisHistory.date')}</TableHead>
                    <TableHead>{t('analysisHistory.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBatches.map((batch) => (
                    <TableRow key={batch.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="font-medium">
                          {batch.job_title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {batch.total_candidates || 0} {t('analysisHistory.candidates')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground max-w-xs truncate">
                          {batch.job_requirements}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(batch.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewBatch(batch)}
                            title={t('analysisHistory.viewBatchDetails')}
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
                                <AlertDialogTitle>{t('analysisHistory.deleteBatch')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('analysisHistory.deleteBatchDescription')}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('analysisHistory.cancel')}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteBatch(batch.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  {t('analysisHistory.delete')}
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

      <BatchHistoryModal
        batch={selectedBatch}
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
      />
    </>
  );
};

export default AnalysisHistory;