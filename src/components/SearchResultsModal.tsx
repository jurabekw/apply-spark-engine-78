
import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ResumeSearchTable from './ResumeSearchTable';
import { useTranslation } from 'react-i18next';

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

  const results: any[] = [];

  const toStr = (v: any) => (typeof v === 'string' ? v : v?.toString?.() ?? '');
  const toArray = (v: any): any[] => (Array.isArray(v) ? v : v != null ? [v] : []);
  const parseMaybeJson = (val: any): any => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        // Try NDJSON
        const lines = val.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length > 1) {
          const parsed = lines
            .map((l) => {
              try {
                return JSON.parse(l);
              } catch {
                return null;
              }
            })
            .filter(Boolean);
          if (parsed.length) return parsed;
        }
      }
    }
    return val;
  };

  const toSkills = (v: any): string[] => {
    if (!v) return [];
    if (Array.isArray(v)) {
      return v.map((s: any) => (typeof s === 'string' ? s : s?.name || '')).filter(Boolean);
    }
    if (typeof v === 'string') {
      return v.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  };

  const isCandidateLike = (obj: any): boolean => {
    if (!obj || typeof obj !== 'object') return false;
    return Boolean(
      obj.title ||
        obj.position ||
        obj.name ||
        obj.alternate_url ||
        obj.url ||
        obj.web_url ||
        obj.link ||
        obj.hh_url ||
        obj.key_skills ||
        obj.AI_score || obj.ai_score || obj.score
    );
  };

  const mapItem = (item: any) => {
    const title = item?.title || item?.position || item?.name || 'Candidate';
    const experience = item?.experience || item?.experience_text || item?.total_experience || item?.work_experience || '';
    const education_level = item?.education_level || item?.education || '';
    const score =
      item?.AI_score ?? (item?.ai_score != null ? `${item.ai_score}%` : undefined) ?? (item?.score != null ? `${item.score}%` : undefined) ?? 'N/A';
    const url = item?.alternate_url || item?.url || item?.web_url || item?.link || item?.hh_url || '';

    const key_skills = toSkills(item?.key_skills || item?.skills);

      return {
        title: toStr(title),
        experience: toStr(experience),
        education_level: toStr(education_level),
        AI_score: toStr(score),
        key_skills,
        alternate_url: toStr(url),
        score_reasoning: toStr(item?.score_reasoning || item?.reasoning || item?.ai_reasoning),
        strengths: toSkills(item?.strengths),
        areas_for_improvement: toSkills(item?.areas_for_improvement || item?.weaknesses),
        recommendations: toStr(item?.recommendations || item?.recommendation),
      };
  };

  const toCandidate = (obj: any) => (isCandidateLike(obj) ? mapItem(obj) : null);

  const visit = (node: any) => {
    if (!node) return;
    node = parseMaybeJson(node);
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (typeof node !== 'object') return;

    // Common top-level shapes
    if (node.status === 'success' && node.candidates) {
      toArray(parseMaybeJson(node.candidates)).forEach(visit);
      return;
    }
    if (node.candidates) {
      toArray(parseMaybeJson(node.candidates)).forEach(visit);
      return;
    }
    if (Array.isArray((node as any).bundles)) {
      (node as any).bundles.forEach((b: any) => visit(b));
      return;
    }
    if (Array.isArray((node as any).result)) {
      (node as any).result.forEach(visit);
      return;
    }
    if (Array.isArray((node as any).items)) {
      (node as any).items.forEach(visit);
      return;
    }

    const cand = toCandidate(node);
    if (cand) {
      results.push(cand);
      return;
    }

    Object.values(node).forEach(visit);
  };

  visit(response);
  return results;
};

const SearchResultsModal = ({ isOpen, onClose, search }: SearchResultsModalProps) => {
  const { t } = useTranslation();
  const candidates = useMemo(() => normalizeCandidates(search?.response), [search]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[92vw] max-w-5xl xl:max-w-6xl h-[85vh] min-h-0 p-0 overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex flex-col gap-1">
            <span>{t('messages.searchResults')}</span>
            {search && (
              <span className="text-sm text-muted-foreground font-normal">
                {search.job_title} • {getExperienceLevelLabel(search.experience_level)} • {search.required_skills}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {candidates.length > 0 ? (
          <div className="flex-1 min-h-0 overflow-y-auto p-6">
            <ResumeSearchTable candidates={candidates as any[]} />
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            {t('messages.noSavedResults')}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SearchResultsModal;
