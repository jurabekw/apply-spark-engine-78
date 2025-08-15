import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LinkedinSearchTable } from './LinkedinSearchTable';

interface LinkedinSearchResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  search: any | null;
}

const getExperienceLevelLabel = (level: string): string => {
  switch (level) {
    case 'junior': return 'Junior (0-2 years)';
    case 'mid': return 'Mid-level (2-5 years)';
    case 'senior': return 'Senior (5+ years)';
    default: return level || 'Not specified';
  }
};

const normalizeCandidates = (response: any): any[] => {
  if (!response) return [];

  const toStr = (val: any): string => {
    if (typeof val === 'string') return val;
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val || '');
  };

  const toArray = (val: any): string[] => {
    if (Array.isArray(val)) return val.map(toStr);
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed.map(toStr) : [val];
      } catch {
        return val.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    return val ? [toStr(val)] : [];
  };

  const parseMaybeJson = (val: any): any => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }
    return val;
  };

  const toSkills = (val: any): string[] => {
    const parsed = parseMaybeJson(val);
    if (Array.isArray(parsed)) return parsed.map(toStr);
    if (typeof parsed === 'string') {
      return parsed.split(/[,;]/).map(s => s.trim()).filter(Boolean);
    }
    return [];
  };

  const isCandidateLike = (obj: any): boolean => {
    return obj && (
      obj.hasOwnProperty('title') ||
      obj.hasOwnProperty('name') ||
      obj.hasOwnProperty('AI_score') ||
      obj.hasOwnProperty('ai_score') ||
      obj.hasOwnProperty('score')
    );
  };

  const extractCandidates = (obj: any, path: string = ''): any[] => {
    if (!obj || typeof obj !== 'object') return [];

    let candidates: any[] = [];

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        if (isCandidateLike(item)) {
          candidates.push(item);
        } else {
          candidates.push(...extractCandidates(item, `${path}[${index}]`));
        }
      });
    } else {
      if (isCandidateLike(obj)) {
        candidates.push(obj);
      } else {
        Object.entries(obj).forEach(([key, value]) => {
          candidates.push(...extractCandidates(value, path ? `${path}.${key}` : key));
        });
      }
    }

    return candidates;
  };

  const rawCandidates = extractCandidates(response);

  return rawCandidates.map((candidate, index) => ({
    title: toStr(candidate.title || candidate.name || `Candidate ${index + 1}`),
    experience: toStr(candidate.experience || candidate.experience_level || candidate.seniority || ''),
    AI_score: toStr(candidate.AI_score || candidate.ai_score || candidate.score || '0'),
    key_skills: toSkills(candidate.key_skills || candidate.skills || candidate.technologies || []),
    alternate_url: toStr(candidate.alternate_url || candidate.linkedin_url || candidate.profile_url || candidate.url || ''),
    raw_data: candidate
  }));
};

export const LinkedinSearchResultsModal: React.FC<LinkedinSearchResultsModalProps> = ({
  isOpen,
  onClose,
  search,
}) => {
  const candidates = useMemo(() => {
    if (!search?.response) return [];
    return normalizeCandidates(search.response);
  }, [search]);

  if (!search) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>LinkedIn Search Results</DialogTitle>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Job Title:</strong> {search.job_title}</p>
            <p><strong>Experience Level:</strong> {getExperienceLevelLabel(search.experience_level)}</p>
            <p><strong>Required Skills:</strong> {search.required_skills}</p>
          </div>
        </DialogHeader>
        
        <div className="mt-4">
          {candidates.length > 0 ? (
            <LinkedinSearchTable candidates={candidates} />
          ) : (
            <div className="text-center py-8 text-gray-500">
              No results found for this search.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};