import React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ResumeSearchTable from "@/components/ResumeSearchTable";
import SearchHistory from "@/components/SearchHistory";
import { useTranslation } from 'react-i18next';

// Types
type Candidate = {
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
};

// Debug stats for normalization
type DebugStats = {
  extracted: number;
  kept: number;
  dropped: number;
  keptByUrl: number;
  droppedByUrl: number;
  keptByFP: number;
  droppedByFP: number;
  skipped: number; // items where no meaningful key could be formed
  noDedupe: boolean;
};

// Cities data for Uzbekistan
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

// Validation Schema
const schema = z.object({
  jobTitle: z.string().min(2, "Please enter at least 2 characters"),
  requiredSkills: z.string().transform(s => s.replace(/\s*,\s*/g, ", ")).refine(s => s.split(",").map(t => t.trim()).filter(Boolean).length > 0, {
    message: "Please enter skills separated by commas"
  }),
  experienceLevel: z.enum(["noExperience", "between1And3", "between3And6", "moreThan6"]),
  city: z.string().min(1, "Please select a city")
});

// Helpers
const parseScore = (score: string): number => {
  const m = score.match(/\d{1,3}/);
  if (!m) return 0;
  const n = Math.min(100, parseInt(m[0]!, 10));
  return n;
};
const scoreTone = (n: number) => {
  if (n >= 80) return {
    bg: "bg-success",
    text: "text-success-foreground"
  };
  if (n >= 60) return {
    bg: "bg-warning",
    text: "text-warning-foreground"
  };
  return {
    bg: "bg-destructive",
    text: "text-destructive-foreground"
  };
};
function normalizeCandidates(payload: any, opts?: {
  noDedupe?: boolean;
  onStats?: (stats: Omit<DebugStats, 'noDedupe'>) => void;
}): Candidate[] {
  const results: Candidate[] = [];
  const toArray = (val: any): any[] => {
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
  };
  const parseMaybeJson = (val: any): any => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        // Try NDJSON
        const lines = val.split("\n").map(l => l.trim()).filter(Boolean);
        if (lines.length > 1) {
          const parsed = lines.map(l => {
            try {
              return JSON.parse(l);
            } catch {
              return null;
            }
          }).filter(Boolean);
          return parsed.length ? parsed : val;
        }
      }
    }
    return val;
  };
  const isCandidateLike = (obj: any): boolean => {
    if (!obj || typeof obj !== "object") return false;
    return Boolean(obj.title || obj.alternate_url || obj.AI_score || obj.experience || obj.education_level || obj.key_skills);
  };
  const toCandidate = (obj: any): Candidate | null => {
    if (!obj || typeof obj !== "object") return null;
    // Some Make/Integromat shapes nest the payload
    const candidateObj = obj.content?.data ?? obj.content ?? obj.output?.data ?? obj.output ?? obj.data ?? obj;
    if (!isCandidateLike(candidateObj)) return null;
    const skillsRaw = (candidateObj.key_skills ?? candidateObj.skills) as any;
    const key_skills = Array.isArray(skillsRaw) ? skillsRaw.map((s: any) => String(s)) : typeof skillsRaw === "string" ? skillsRaw.split(",").map(s => s.trim()).filter(Boolean) : [];
    const scoreRaw = candidateObj.AI_score ?? candidateObj.ai_score ?? candidateObj.score;
    return {
      title: String(candidateObj.title ?? candidateObj.position ?? candidateObj.name ?? "Candidate"),
      experience: String(candidateObj.experience ?? candidateObj.experience_years ?? ""),
      education_level: String(candidateObj.education_level ?? candidateObj.education ?? ""),
      AI_score: scoreRaw != null ? String(scoreRaw) : "0",
      key_skills,
      alternate_url: String(
        candidateObj.alternate_url ??
        candidateObj.url ??
        candidateObj.link ??
        candidateObj.web_url ??
        candidateObj.hh_url ??
        ""
      ),
      score_reasoning: candidateObj.score_reasoning ?? candidateObj.reasoning ?? candidateObj.ai_reasoning ?? undefined,
      strengths: Array.isArray(candidateObj.strengths) ? candidateObj.strengths.map((s: any) => String(s)) : undefined,
      areas_for_improvement: Array.isArray(candidateObj.areas_for_improvement) ? candidateObj.areas_for_improvement.map((s: any) => String(s)) : (Array.isArray(candidateObj.weaknesses) ? candidateObj.weaknesses.map((s: any) => String(s)) : undefined),
      recommendations: candidateObj.recommendations ?? candidateObj.recommendation ?? undefined,
    };
  };
  const visit = (node: any) => {
    if (!node) return;
    node = parseMaybeJson(node);
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (typeof node !== "object") return;

    // Common top-level shapes
    if (node.status === "success" && node.candidates) {
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

    // Try to interpret current node as a candidate
    const cand = toCandidate(node);
    if (cand) {
      results.push(cand);
      return;
    }

    // Objects with numeric keys or nested collections
    const values = Object.values(node);
    if (values.length) values.forEach(visit);
  };
  try {
    visit(payload);
  } catch (e) {
    console.error("Failed to normalize candidates:", e, payload);
  }
  const extracted = results.length;
  if (opts?.noDedupe) {
    console.debug("normalizeCandidates: dedupe disabled", {
      extracted
    });
    opts?.onStats?.({
      extracted,
      kept: extracted,
      dropped: 0,
      keptByUrl: 0,
      droppedByUrl: 0,
      keptByFP: 0,
      droppedByFP: 0,
      skipped: 0
    });
    return results;
  }

  // Deduplicate (conservative)
  console.debug("normalizeCandidates: before dedupe", {
    extracted
  });
  const seenAlt = new Set<string>();
  const seenFP = new Set<string>();
  let keptByUrl = 0;
  let droppedByUrl = 0;
  let keptByFP = 0;
  let droppedByFP = 0;
  let skipped = 0;
  const deduped = results.filter((c, i) => {
    const url = (c.alternate_url || "").trim();
    if (url) {
      if (seenAlt.has(url)) {
        droppedByUrl++;
        console.debug("dedupe drop", {
          i,
          keyType: "alternate_url",
          key: url,
          title: c.title
        });
        return false;
      }
      seenAlt.add(url);
      keptByUrl++;
      console.debug("dedupe keep", {
        i,
        keyType: "alternate_url",
        key: url,
        title: c.title
      });
      return true;
    }
    const meaningful = Boolean(c.title && c.experience && (c.key_skills?.length || 0) > 0);
    if (!meaningful) {
      skipped++;
      console.debug("dedupe skip", {
        i,
        keyType: "none",
        title: c.title
      });
      return true; // don't dedupe when we can't form a meaningful fingerprint
    }
    const fp = `t:${c.title}|e:${c.experience}|edu:${c.education_level}|s:${(c.key_skills || []).slice(0, 5).join(',')}`;
    if (seenFP.has(fp)) {
      droppedByFP++;
      console.debug("dedupe drop", {
        i,
        keyType: "fingerprint",
        key: fp,
        title: c.title
      });
      return false;
    }
    seenFP.add(fp);
    keptByFP++;
    console.debug("dedupe keep", {
      i,
      keyType: "fingerprint",
      key: fp,
      title: c.title
    });
    return true;
  });
  console.debug("normalizeCandidates: after dedupe", {
    kept: deduped.length
  });
  opts?.onStats?.({
    extracted,
    kept: deduped.length,
    dropped: extracted - deduped.length,
    keptByUrl,
    droppedByUrl,
    keptByFP,
    droppedByFP,
    skipped
  });
  return deduped;
}
const WEBHOOK_URL = "https://hook.eu2.make.com/rqe1ozj0uxqwb8cf19i1prbwhi8fdalk";
async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit & {
  timeout?: number;
} = {}) {
  const {
    timeout = 60000,
    ...rest
  } = init;
  if ((AbortSignal as any).timeout) {
    return fetch(input, {
      ...rest,
      signal: (AbortSignal as any).timeout(timeout)
    });
  }
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(input, {
      ...rest,
      signal: controller.signal
    });
  } finally {
    clearTimeout(id);
  }
}
export default function ResumeSearch() {
  // SEO
  useEffect(() => {
    document.title = "HH Candidate Search | TalentSpark";
    const desc = "Search HH.ru candidates with AI scoring. Enter role, skills, and experience to find top candidates.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);

    // Canonical
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", window.location.origin + "/resume-search");
  }, []);
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const { t } = useTranslation();

  // Form
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      jobTitle: "",
      requiredSkills: "",
      experienceLevel: "between1And3",
      city: "2759" // Default to Tashkent
    }
  });

  // State
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Debug candidates state changes
  useEffect(() => {
    console.log('Candidates state updated:', {
      count: candidates.length,
      candidates: candidates.slice(0, 3).map(c => ({
        title: c.title,
        url: c.alternate_url
      }))
    });
  }, [candidates]);
  const [noDedupe, setNoDedupe] = useState(true);
  const [rawPayload, setRawPayload] = useState<any | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugStats | null>(null);
  const debugEnabled = useMemo(() => new URL(window.location.href).searchParams.get("debug") === "1", []);
  const stepTimer = useRef<number | null>(null);

  // Loading steps messaging
  useEffect(() => {
    if (!loading) {
      if (stepTimer.current) window.clearInterval(stepTimer.current);
      setLoadingStep(0);
      return;
    }
    const steps = 3;
    stepTimer.current = window.setInterval(() => {
      setLoadingStep(s => (s + 1) % steps);
    }, 8000);
    return () => {
      if (stepTimer.current) window.clearInterval(stepTimer.current);
    };
  }, [loading]);

  // Persist no-merge-duplicates toggle
  useEffect(() => {
    try {
      const saved = localStorage.getItem("resumeSearch.noDedupe");
      if (saved === "1" || saved === "true") setNoDedupe(true);else if (saved === "0" || saved === "false") setNoDedupe(false);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("resumeSearch.noDedupe", noDedupe ? "1" : "0");
    } catch {}
  }, [noDedupe]);

  // Share link (encodes current form)
  const shareLink = useMemo(() => {
    const v = form.getValues();
    const params = new URLSearchParams({
      title: v.jobTitle,
      skills: v.requiredSkills,
      exp: v.experienceLevel,
      city: v.city
    });
    return `${window.location.origin}/resume-search?${params.toString()}`;
  }, [form.watch(["jobTitle", "requiredSkills", "experienceLevel", "city"])]) as string;

  // Prefill from URL
  useEffect(() => {
    const url = new URL(window.location.href);
    const title = url.searchParams.get("title") ?? "";
    const skills = url.searchParams.get("skills") ?? "";
    const exp = url.searchParams.get("exp") as any ?? "between1And3";
    const city = url.searchParams.get("city") ?? "2759";
    form.reset({
      jobTitle: title,
      requiredSkills: skills,
      experienceLevel: exp,
      city: city
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handleSearch = async (values: z.infer<typeof schema>) => {
    setLoading(true);
    setError(null);
    setCandidates([]);
    setRawPayload(null);
    if (debugEnabled) setDebugInfo(null);
    try {
      const response = await fetchWithTimeout(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          job_title: values.jobTitle.trim(),
          required_skills: values.requiredSkills.trim(),
          experience_level: values.experienceLevel,
          city: values.city
        }),
        timeout: 60000
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const raw = await response.json();
      console.debug("HH webhook raw payload:", raw);
      setRawPayload(raw);

      // Add comprehensive logging BEFORE normalization
      console.debug("HH webhook raw payload STRUCTURE:", {
        type: typeof raw,
        isArray: Array.isArray(raw),
        keys: typeof raw === 'object' ? Object.keys(raw || {}) : [],
        candidatesProperty: raw?.candidates,
        candidatesType: typeof raw?.candidates,
        candidatesLength: Array.isArray(raw?.candidates) ? raw.candidates.length : 'not array'
      });
      console.log('Raw webhook response data:', raw);
      const normalized = normalizeCandidates(raw, {
        noDedupe,
        onStats: stats => {
          if (debugEnabled) setDebugInfo({
            ...stats,
            noDedupe
          });
        }
      });
      console.log('Normalized candidates:', {
        count: normalized.length,
        candidates: normalized
      });

      // Add detailed logging AFTER normalization
      console.debug("POST-NORMALIZATION RESULTS:", {
        normalizedCount: normalized.length,
        normalizedCandidates: normalized,
        firstCandidate: normalized[0],
        secondCandidate: normalized[1],
        thirdCandidate: normalized[2],
        allTitles: normalized.map(c => c.title)
      });
      console.debug("ABOUT TO SET CANDIDATES STATE:", normalized);
      setCandidates(normalized);
      console.debug("STATE SET. Current candidates length should be:", normalized.length);
      if (normalized.length === 0) {
        setError("No candidates found matching your criteria. Try adjusting your requirements.");
      }
      if (user?.id) {
        // Save search record
        const {
          error: dbError
        } = await supabase.from("hh_searches").insert({
          user_id: user.id,
          job_title: values.jobTitle.trim(),
          required_skills: values.requiredSkills.trim(),
          experience_level: values.experienceLevel,
          response: raw,
          candidate_count: normalized.length
        });
        if (dbError) {
          console.error("Failed to save hh_searches:", dbError);
        }

        // Save HH candidates to candidates table so they appear in the main candidate view
        if (normalized.length > 0) {
          // Deduplicate by URL for DB only (UI still shows all)
          const normUrl = (u: string) => (u || "").trim().replace(/\/$/, "").toLowerCase();
          const seen = new Set<string>();
          const uniqueForDb = normalized.filter(c => {
            const u = normUrl(c.alternate_url);
            if (!u) return true; // keep if no URL (can't dedupe)
            if (seen.has(u)) return false;
            seen.add(u);
            return true;
          });

          const toRecord = (candidate: typeof normalized[number]) => ({
            user_id: user.id,
            name: candidate.title || 'HH Candidate',
            email: null as any,
            phone: null as any,
            position: candidate.title || null,
            experience_years: candidate.experience ? (parseInt(candidate.experience.match(/\d+/)?.[0] || '0') || null) : null,
            skills: candidate.key_skills || [],
            education: candidate.education_level || null,
            work_history: null as any,
            resume_file_path: null as any,
            original_filename: null as any,
            ai_score: parseScore(candidate.AI_score),
            ai_analysis: {
              hh_url: candidate.alternate_url,
              experience: candidate.experience,
              education_level: candidate.education_level,
              skills: candidate.key_skills,
              score_reasoning: (candidate as any).score_reasoning,
              strengths: (candidate as any).strengths,
              areas_for_improvement: (candidate as any).areas_for_improvement,
              recommendations: (candidate as any).recommendations,
            },
            status: 'new',
            source: 'hh_search',
          });

          const records = uniqueForDb.map(toRecord);
          const chunkSize = 50;
          let inserted = 0;
          let failed = 0;

          // Helper to insert a single record when a batch fails
          const insertIndividually = async (batch: any[]) => {
            for (const rec of batch) {
              const { error } = await supabase.from('candidates').insert(rec);
              if (error) {
                console.error('Insert failed for record:', rec, error);
                failed += 1;
              } else {
                inserted += 1;
              }
            }
          };

          for (let i = 0; i < records.length; i += chunkSize) {
            const batch = records.slice(i, i + chunkSize);
            const { error } = await supabase.from('candidates').insert(batch);
            if (error) {
              console.warn('Batch insert failed, falling back to per-row inserts:', error);
              await insertIndividually(batch);
            } else {
              inserted += batch.length;
            }
          }

          toast({
            title: 'Candidates saved',
            description: `${inserted}/${records.length} saved. All ${normalized.length} shown in results.`,
          });

          // Refresh the main candidates view on dashboard
          window.dispatchEvent(new CustomEvent('candidatesUpdated'));
        }
      }
    } catch (err: any) {
      if (err?.name === "TimeoutError") {
        setError("Search timeout. The request is taking too long. Please try again.");
      } else if (err?.name === "AbortError") {
        setError("Search was cancelled. Please try again.");
      } else if (err?.message?.includes("Failed to fetch")) {
        setError("Failed to connect. Please check your internet connection.");
      } else {
        setError(`Search failed: ${err?.message || "Unknown error"}. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };
  const onSubmit = form.handleSubmit(handleSearch);
  const handleRerunSearch = (search: {
    job_title: string;
    required_skills: string;
    experience_level: string;
  }) => {
    form.setValue('jobTitle', search.job_title);
    form.setValue('requiredSkills', search.required_skills);
    form.setValue('experienceLevel', search.experience_level as any);
    // Trigger the search
    handleSearch({
      jobTitle: search.job_title,
      requiredSkills: search.required_skills,
      experienceLevel: search.experience_level as any
    });
  };
  const renderCandidateCard = (c: Candidate, idx: number) => {
    const n = parseScore(c.AI_score);
    const tone = scoreTone(n);
    return <Card key={`${c.alternate_url && c.alternate_url.trim() || c.title || 'cand'}-${idx}`} className="transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-xl font-bold leading-tight">{c.title} (#{idx + 1})</CardTitle>
            <Badge className={`${tone.bg} ${tone.text} border-transparent`}>{n}%</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">
            <div>📅 <span className="font-medium">{t('resumeSearchPage.experience')}:</span> {c.experience}</div>
            <div>🎓 <span className="font-medium">{t('resumeSearchPage.education')}:</span> {c.education_level}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {c.key_skills?.map((s, i) => <Badge key={i} variant="secondary" className="bg-accent text-accent-foreground">
                {s}
              </Badge>)}
          </div>
          <div className="pt-2">
            {c.alternate_url?.trim() ? <a href={c.alternate_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline" aria-label="View resume on HH.ru">
                {t('resumeSearchPage.viewResume')} <ExternalLink className="h-4 w-4" />
              </a> : <span className="text-sm text-muted-foreground">{t('resumeSearchPage.resumeLinkUnavailable')}</span>}
          </div>
        </CardContent>
      </Card>;
  };
  const LoadingStatus = () => <div className="mt-6 rounded-md border bg-card p-4 text-sm">
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" aria-label="Loading spinner" />
        <span>{t('resumeSearchPage.searchingHhCandidates')}</span>
      </div>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">
        <li className={loadingStep === 0 ? "text-foreground" : ""}>{t('resumeSearchPage.connectingToHhRu')}</li>
        <li className={loadingStep === 1 ? "text-foreground" : ""}>{t('resumeSearchPage.analyzingResumesWithAi')}</li>
        <li className={loadingStep === 2 ? "text-foreground" : ""}>{t('resumeSearchPage.preparingResults')}</li>
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">{t('resumeSearchPage.usuallyTakes')}</p>
    </div>;
  return <main className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">{t('resumeSearchPage.title')}</h1>
        <p className="text-muted-foreground">{t('resumeSearchPage.subtitle')}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{t('resumeSearchPage.searchCandidates')}</CardTitle>
          <CardDescription>{t('resumeSearchPage.enterRequirements')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <FormField control={form.control} name="jobTitle" render={({
              field
            }) => <FormItem className="md:col-span-1">
                    <FormLabel>{t('tableHeaders.jobTitle')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('resumeSearch.jobTitlePlaceholder')} aria-label="Job Title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              <FormField control={form.control} name="experienceLevel" render={({
              field
            }) => <FormItem className="md:col-span-1">
                    <FormLabel>{t('tableHeaders.experienceLevel')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger aria-label="Experience Level">
                          <SelectValue placeholder={t('selects.selectExperience')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="noExperience">{t('experienceLevels.noExperience')}</SelectItem>
                        <SelectItem value="between1And3">{t('experienceLevels.between1And3')}</SelectItem>
                        <SelectItem value="between3And6">{t('experienceLevels.between3And6')}</SelectItem>
                        <SelectItem value="moreThan6">{t('experienceLevels.moreThan6')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>} />

              <FormField control={form.control} name="city" render={({
              field
            }) => <FormItem className="md:col-span-1">
                    <FormLabel>City</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger aria-label="City">
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60">
                        {UZBEKISTAN_CITIES.map((city) => (
                          <SelectItem key={city.code} value={city.code}>
                            <div className="flex flex-col">
                              <span className="font-medium">{city.nameEn}</span>
                              <span className="text-xs text-muted-foreground">{city.nameRu}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>} />

              <FormField control={form.control} name="requiredSkills" render={({
              field
            }) => <FormItem className="md:col-span-3">
                    <FormLabel>{t('tableHeaders.requiredSkills')}</FormLabel>
                    <FormControl>
                      <Textarea rows={4} placeholder={t('resumeSearch.skillsPlaceholder')} aria-label="Required Skills" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">{t('resumeSearchPage.separateSkills')}</p>
                    <FormMessage />
                  </FormItem>} />

              <div className="md:col-span-3 flex flex-wrap items-center gap-3">
                <Button type="submit" variant="brand" disabled={loading} aria-disabled={loading}>
                  {loading ? t('resumeSearchPage.searchingHhRu') : t('resumeSearchPage.searchCandidatesButton')}
                </Button>
                
                <div className="ml-auto flex items-center gap-2">
                  <Checkbox id="noDedupe" checked={noDedupe} onCheckedChange={v => setNoDedupe(Boolean(v))} />
                  <Label htmlFor="noDedupe" className="text-sm">{t('resumeSearchPage.dontMergeDuplicates')}</Label>
                </div>
              </div>

              {loading && <div className="md:col-span-3">
                  <LoadingStatus />
                </div>}

              {error && !loading && <div className="md:col-span-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-destructive">
                  {error}
                </div>}
            </form>
          </Form>
        </CardContent>
      </Card>

      {debugEnabled && <Card className="mt-6">
          <CardHeader>
            <CardTitle>Debug</CardTitle>
            <CardDescription>Normalization and deduplication stats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="font-medium">Dedupe disabled:</span> {String(noDedupe)}</div>
              {debugInfo && <>
                  <div><span className="font-medium">Extracted:</span> {debugInfo.extracted}</div>
                  <div><span className="font-medium">Kept:</span> {debugInfo.kept}</div>
                  <div><span className="font-medium">Dropped:</span> {debugInfo.dropped}</div>
                  <div><span className="font-medium">Kept by URL:</span> {debugInfo.keptByUrl}</div>
                  <div><span className="font-medium">Dropped by URL:</span> {debugInfo.droppedByUrl}</div>
                  <div><span className="font-medium">Kept by FP:</span> {debugInfo.keptByFP}</div>
                  <div><span className="font-medium">Dropped by FP:</span> {debugInfo.droppedByFP}</div>
                  <div><span className="font-medium">Skipped:</span> {debugInfo.skipped}</div>
                </>}
            </div>
            <div className="mt-4">
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="link" className="p-0">Show raw webhook JSON</Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <pre className="mt-2 max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs">
                    {rawPayload ? JSON.stringify(rawPayload, null, 2) : "No payload"}
                  </pre>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </CardContent>
        </Card>}

      {/* Results */}
      <section className="mt-8 space-y-6">
        {!loading && !error && candidates.length > 0 && (
          <ResumeSearchTable candidates={candidates} loading={loading} />
        )}
        {!loading && !error && (
          <SearchHistory onRerunSearch={handleRerunSearch} />
        )}
      </section>
    </main>;
}