
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Search, Eye, Trash2, Clock, Trash } from 'lucide-react';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import SearchResultsModal from './SearchResultsModal';
import { useTranslation } from 'react-i18next';

// Cities data for display
const UZBEKISTAN_CITIES = [
  { code: "2759", nameEn: "Tashkent", nameRu: "Ташкент" },
  { code: "2778", nameEn: "Samarkand", nameRu: "Самарканд" },
  { code: "2781", nameEn: "Bukhara", nameRu: "Бухара" },
  { code: "2768", nameEn: "Andijan", nameRu: "Андижан" },
  { code: "2779", nameEn: "Namangan", nameRu: "Наманган" },
  { code: "2782", nameEn: "Fergana", nameRu: "Фергана" },
  { code: "2784", nameEn: "Kokand", nameRu: "Коканд" },
  { code: "2785", nameEn: "Margilan", nameRu: "Маргилан" },
  { code: "2783", nameEn: "Karshi", nameRu: "Карши" },
  { code: "2789", nameEn: "Termez", nameRu: "Термез" },
  { code: "2788", nameEn: "Urgench", nameRu: "Ургенч" },
  { code: "2780", nameEn: "Nukus", nameRu: "Нукус" },
  { code: "2790", nameEn: "Navoiy", nameRu: "Навои" },
  { code: "2786", nameEn: "Jizzakh", nameRu: "Джизак" },
  { code: "2787", nameEn: "Chirchiq", nameRu: "Чирчик" },
  { code: "2791", nameEn: "Shakhrisabz", nameRu: "Шахрисабз" },
  { code: "2766", nameEn: "Almaliq", nameRu: "Алмалык" },
  { code: "2767", nameEn: "Angren", nameRu: "Ангрен" },
];

interface SearchHistoryProps {
  onRerunSearch?: (search: { job_title: string; required_skills: string; experience_level: string; city?: string }) => void;
}

const SearchHistory = ({ onRerunSearch }: SearchHistoryProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { searches, loading, deleteSearch, deleteAllSearches } = useSearchHistory();
  const { t, i18n } = useTranslation();

  // State to handle viewing saved results
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [selectedSearch, setSelectedSearch] = useState<any>(null);

  const getCityLabel = (cityCode?: string) => {
    if (!cityCode) return 'All cities';
    const city = UZBEKISTAN_CITIES.find(c => c.code === cityCode);
    return city ? (i18n.language === 'ru' ? city.nameRu : city.nameEn) : cityCode;
  };

  const getExperienceLevelLabel = (level: string) => {
    const labels = {
      'noExperience': t('experienceLevels.noExperience'),
      'between1And3': t('experienceLevels.between1And3'),
      'between3And6': t('experienceLevels.between3And6'),
      'moreThan6': t('experienceLevels.moreThan6')
    };
    return labels[level as keyof typeof labels] || level;
  };

  const formatDate = (dateString: string) => {
    const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
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
        experience_level: search.experience_level,
        city: search.city
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
            <span className="ml-2 text-muted-foreground">{t('messages.loadingSearchHistory')}</span>
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
              <CardTitle>{t('searchHistory.title')} ({filteredSearches.length})</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {searches.length > 0 && (
                <>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="gap-2">
                        <Trash className="w-4 h-4" />
                        {t('searchHistory.deleteAll')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('searchHistory.deleteAllTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('searchHistory.deleteAllDescription', { count: searches.length })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={deleteAllSearches}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          {t('searchHistory.deleteAll')}
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
          {filteredSearches.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                {searches.length === 0 ? t('messages.noSearchHistoryYet') : t('messages.noMatchingSearches')}
              </h3>
              <p className="text-muted-foreground text-sm">
                {searches.length === 0 
                  ? t('messages.searchHistoryDescription')
                  : t('messages.searchHistoryTryAdjusting')
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('tableHeaders.jobTitle')}</TableHead>
                    <TableHead>{t('tableHeaders.requiredSkills')}</TableHead>
                    <TableHead>{t('tableHeaders.experienceLevel')}</TableHead>
                    <TableHead>{t('tableHeaders.city')}</TableHead>
                    <TableHead>{t('tableHeaders.results')}</TableHead>
                    <TableHead>{t('tableHeaders.date')}</TableHead>
                    <TableHead>{t('tableHeaders.actions')}</TableHead>
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
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                          {getCityLabel(search.city)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{search.candidate_count}</span> {t('searchHistory.candidates')}
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
                            title={t('searchHistory.viewSavedResults')}
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
                                <AlertDialogTitle>{t('searchHistory.deleteEntryTitle')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('searchHistory.deleteEntryDescription')}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteSearch(search.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  {t('common.delete')}
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
