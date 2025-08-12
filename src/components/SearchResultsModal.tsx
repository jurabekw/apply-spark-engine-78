
import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ResumeSearchTable from './ResumeSearchTable';

interface SearchResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  search: any | null;
}

const getExperienceLevelLabel = (level: string) => {
  const labels = {
    noExperience: 'No Experience',
    between1And3: '1-3 Years',
    between3And6: '3-6 Years',
    moreThan6: '6+ Years',
  };
  return labels[level as keyof typeof labels] || level || 'N/A';
};

const normalizeCandidates = (response: any): any[] => {
  if (!response) return [];

  const toStr = (v: any) => (typeof v === 'string' ? v : v?.toString?.() ?? '');
  const toSkills = (v: any): string[] => {
    if (!v) return [];
    if (Array.isArray(v)) {
      // array of strings or objects with name
      return v.map((s: any) => (typeof s === 'string' ? s : s?.name || '')).filter(Boolean);
    }
    if (typeof v === 'string') {
      return v.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
    };

  const mapItem = (item: any) => {
    const title = item?.title || item?.position || item?.name || 'Candidate';
    const experience =
      item?.experience ||
      item?.experience_text ||
      item?.total_experience ||
      item?.work_experience ||
      '';
    const education_level = item?.education_level || item?.education || '';
    const score =
      item?.AI_score ||
      (item?.ai_score != null ? `${item.ai_score}%` : undefined) ||
      (item?.score != null ? `${item.score}%` : undefined) ||
      'N/A';
    const url =
      item?.alternate_url ||
      item?.url ||
      item?.web_url ||
      item?.link ||
      item?.hh_url ||
      '';

    const key_skills = toSkills(item?.key_skills);

    return {
      title: toStr(title),
      experience: toStr(experience),
      education_level: toStr(education_level),
      AI_score: toStr(score),
      key_skills,
      alternate_url: toStr(url),
    };
  };

  if (Array.isArray(response)) {
    return response.map(mapItem);
  }

  const arr =
    response?.candidates ||
    response?.items ||
    response?.results ||
    response?.data ||
    [];

  if (Array.isArray(arr)) {
    return arr.map(mapItem);
  }

  // Fallback single object
  if (typeof response === 'object') {
    return [mapItem(response)];
  }

  return [];
};

const SearchResultsModal = ({ isOpen, onClose, search }: SearchResultsModalProps) => {
  const candidates = useMemo(() => normalizeCandidates(search?.response), [search]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex flex-col gap-1">
            <span>Search Results</span>
            {search && (
              <span className="text-sm text-muted-foreground font-normal">
                {search.job_title} • {getExperienceLevelLabel(search.experience_level)} • {search.required_skills}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {candidates.length > 0 ? (
          <div className="max-h-[70vh] overflow-y-auto">
            <ResumeSearchTable candidates={candidates as any[]} />
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            No saved results found for this search.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SearchResultsModal;
