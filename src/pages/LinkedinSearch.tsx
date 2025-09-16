import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTrialUsage } from '@/hooks/useTrialUsage';

import ResumeSearchTable from '@/components/ResumeSearchTable';
import LinkedinSearchHistory from '@/components/LinkedinSearchHistory';
import { TrialGuard } from '@/components/TrialGuard';
import { Search, Clock, Settings, Linkedin } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from 'react-i18next';

// Validation schema is defined inside the component to use translations

type SearchFormData = { job_title: string };

const LinkedinSearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [lastSearch, setLastSearch] = useState<SearchFormData | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { canUseAnalysis, recordUsage, analysesRemaining } = useTrialUsage();

  // Validation Schema
  const searchSchema = useMemo(() => z.object({
    job_title: z.string().min(1, t('linkedinSearch.validation.describeCandidate')),
  }), [t]);

  const form = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      job_title: '',
    },
  });

  // Use the proven normalization logic from HH Search
  const normalizeCandidates = (payload: any): any[] => {
    const results: any[] = [];
    
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
      return Boolean(obj.title || obj.name || obj.alternate_url || obj.linkedin_url || obj.AI_score || obj.ai_score || obj.experience || obj.key_skills);
    };
    
    const toCandidate = (obj: any): any | null => {
      if (!obj || typeof obj !== "object") return null;
      
      // Handle nested payload structures from webhook
      const candidateObj = obj.content?.data ?? obj.content ?? obj.output?.data ?? obj.output ?? obj.data ?? obj;
      
      // For LinkedIn webhook, handle the case where output is a JSON string
      let actualCandidate = candidateObj;
      if (typeof candidateObj.output === 'string') {
        try {
          const parsed = JSON.parse(candidateObj.output);
          if (parsed.candidates && Array.isArray(parsed.candidates)) {
            // Return the first candidate from the parsed output
            actualCandidate = parsed.candidates[0] || candidateObj;
          } else {
            actualCandidate = parsed;
          }
        } catch {
          actualCandidate = candidateObj;
        }
      }
      
      if (!isCandidateLike(actualCandidate)) return null;
      
      const skillsRaw = (actualCandidate.key_skills ?? actualCandidate.skills) as any;
      const key_skills = Array.isArray(skillsRaw) 
        ? skillsRaw.map((s: any) => String(s)) 
        : typeof skillsRaw === "string" 
          ? skillsRaw.split(",").map(s => s.trim()).filter(Boolean) 
          : [];
      
      const scoreRaw = actualCandidate.AI_score ?? actualCandidate.ai_score ?? actualCandidate.score;
      
      return {
        title: String(actualCandidate.title ?? actualCandidate.name ?? "LinkedIn Candidate"),
        experience: String(actualCandidate.experience ?? actualCandidate.experience_years ?? ""),
        education_level: String(actualCandidate.education_level ?? actualCandidate.education ?? ""),
        AI_score: scoreRaw != null ? String(scoreRaw) : "0",
        key_skills,
        alternate_url: String(
          actualCandidate.alternate_url ??
          actualCandidate.linkedin_url ??
          actualCandidate.url ??
          actualCandidate.link ??
          actualCandidate.profile_url ??
          ""
        ),
        score_reasoning: actualCandidate.score_reasoning ?? actualCandidate.reasoning ?? actualCandidate.ai_reasoning ?? undefined,
        strengths: Array.isArray(actualCandidate.strengths) ? actualCandidate.strengths.map((s: any) => String(s)) : undefined,
        areas_for_improvement: Array.isArray(actualCandidate.areas_for_improvement) ? actualCandidate.areas_for_improvement.map((s: any) => String(s)) : undefined,
        recommendations: actualCandidate.recommendations ?? actualCandidate.recommendation ?? undefined,
      };
    };
    
    const visit = (node: any) => {
      if (!node) return;
      node = parseMaybeJson(node);
      
      if (Array.isArray(node)) {
        // Handle array of objects with output properties (LinkedIn webhook format)
        node.forEach(item => {
          if (item && typeof item === 'object' && item.output) {
            try {
              const parsed = JSON.parse(item.output);
              visit(parsed);
            } catch {
              visit(item);
            }
          } else {
            visit(item);
          }
        });
        return;
      }
      
      if (typeof node !== "object") return;

      // Handle single object with output property
      if (node.output && typeof node.output === 'string') {
        try {
          const parsed = JSON.parse(node.output);
          visit(parsed);
          return;
        } catch {
          // Continue with normal processing
        }
      }

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
      console.error("Failed to normalize LinkedIn candidates:", e, payload);
    }
    
    console.log('LinkedIn normalization results:', {
      input: payload,
      extracted: results.length,
      candidates: results
    });
    
    return results;
  };

  const onSubmit = async (data: SearchFormData) => {
    if (!user) {
      toast({
        title: t('linkedinSearch.authRequired'),
        description: t('linkedinSearch.loginToSearch'),
        variant: "destructive",
      });
      return;
    }

    // Check if user can use analysis
    if (!canUseAnalysis) {
      toast({
        title: t('trial.errors.limitReached'),
        description: t('trial.errors.limitReachedDesc'),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setSearchResults([]);

    const loadingMessages = [
      "Searching LinkedIn profiles...",
      "Analyzing candidate profiles...",
      "Filtering relevant candidates...",
      "Almost done..."
    ];

    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      if (messageIndex < loadingMessages.length - 1) {
        messageIndex++;
      }
    }, 2000);

    try {
      console.log('Sending search request to n8n webhook...');
      
      // Prepare query parameters
      const queryParams = new URLSearchParams({
        job_title: data.job_title,
        timestamp: new Date().toISOString(),
      });
      
      // Send GET request to n8n webhook
      const webhookResponse = await fetch(`https://n8n.talentspark.uz/webhook/463633d4-a16f-49d7-b0c6-c7e0c53f9013?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!webhookResponse.ok) {
        throw new Error(`Webhook request failed: ${webhookResponse.status}`);
      }

      const webhookData = await webhookResponse.json();
      console.log('Webhook response:', webhookData);

      // Normalize the candidates from the response
      const normalizedCandidates = normalizeCandidates(webhookData);
      console.log('Normalized candidates:', normalizedCandidates);

      // Record usage for this search
      const usageRecorded = await recordUsage('linkedin_search', {
        job_title: data.job_title,
        candidate_count: normalizedCandidates.length,
        timestamp: new Date().toISOString(),
      });

      if (!usageRecorded) {
        // If usage recording failed, stop the process
        return;
      }

      // Store the search in the database
      const { error: dbError } = await supabase
        .from('linkedin_searches')
        .insert({
          user_id: user.id,
          job_title: data.job_title,
          required_skills: '',
          experience_level: 'mid',
          candidate_count: normalizedCandidates.length,
          response: webhookData,
        });

      if (dbError) {
        console.error('Error saving search to database:', dbError);
        toast({
          title: t('toasts.warning'),
          description: t('toasts.errorSavingSearch'),
          variant: "destructive",
        });
      }

      // Save LinkedIn candidates to candidates table like HH Search does
      if (normalizedCandidates.length > 0) {
        const parseScore = (score: string): number => {
          const m = score.match(/\d{1,3}/);
          if (!m) return 0;
          return Math.min(100, parseInt(m[0]!, 10));
        };

        // Deduplicate by URL for DB only
        const normUrl = (u: string) => (u || "").trim().replace(/\/$/, "").toLowerCase();
        const seen = new Set<string>();
        const uniqueForDb = normalizedCandidates.filter(c => {
          const u = normUrl(c.alternate_url);
          if (!u) return true; // keep if no URL (can't dedupe)
          if (seen.has(u)) return false;
          seen.add(u);
          return true;
        });

        const toRecord = (candidate: typeof normalizedCandidates[number]) => ({
          user_id: user.id,
          name: candidate.title || 'LinkedIn Candidate',
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
            linkedin_url: candidate.alternate_url,
            experience: candidate.experience,
            education_level: candidate.education_level,
            skills: candidate.key_skills,
            score_reasoning: candidate.score_reasoning,
            strengths: candidate.strengths,
            areas_for_improvement: candidate.areas_for_improvement,
            recommendations: candidate.recommendations,
          },
          status: 'new',
          source: 'linkedin_search',
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
          title: t('linkedinSearch.candidatesSaved'),
          description: t('linkedinSearch.candidatesSavedDescription', {
            inserted,
            total: records.length,
            shown: normalizedCandidates.length
          }),
        });

        // Refresh the main candidates view on dashboard
        window.dispatchEvent(new CustomEvent('candidatesUpdated'));
      }

      setSearchResults(normalizedCandidates);
      setLastSearch(data);

      toast({
        title: t('linkedinSearch.searchCompleted'),
        description: t('linkedinSearch.foundCandidates', { count: normalizedCandidates.length }),
      });

      // Trigger refresh of search history
      window.dispatchEvent(new CustomEvent('linkedin-search-completed'));

    } catch (error) {
      console.error('LinkedIn search error:', error);
      toast({
        title: t('linkedinSearch.searchFailed'),
        description: error instanceof Error ? error.message : t('errors.unexpectedErrorTryAgain'),
        variant: "destructive",
      });
    } finally {
      clearInterval(messageInterval);
      setIsLoading(false);
    }
  };

  const handleRerunSearch = (searchData: { job_title: string; required_skills: string; experience_level: string }) => {
    form.setValue('job_title', searchData.job_title);
  };

  return (
    <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <Linkedin className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{t('linkedinSearch.title')}</h1>
              <p className="text-gray-600">{t('linkedinSearch.subtitle')}</p>
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{t('linkedinSearch.whatCandidate')}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {analysesRemaining} {t('trial.analysesRemaining')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                     <FormField
                       control={form.control}
                       name="job_title"
                       render={({ field }) => (
                         <FormItem>
                            <FormControl>
                              <Input 
                                placeholder={t('linkedinSearch.placeholder')}
                                {...field} 
                              />
                            </FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />

                       <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            {t('linkedinSearch.searchingLinkedin')}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            {t('linkedinSearch.searchLinkedin')}
                          </div>
                        )}
                      </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {lastSearch && (
              <Card>
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     {t('linkedinSearch.searchResults')}
                     <Badge variant="secondary">{searchResults.length} {t('linkedinSearch.candidates')}</Badge>
                   </CardTitle>
                    <div className="text-sm text-gray-600">
                      <p><strong>{t('linkedinSearch.searchQuery')}:</strong> {lastSearch.job_title}</p>
                    </div>
                 </CardHeader>
                <CardContent>
                  <ResumeSearchTable candidates={searchResults} loading={isLoading} />
                </CardContent>
              </Card>
            )}

            <LinkedinSearchHistory onRerunSearch={handleRerunSearch} />
          </div>
    </div>
  );
};

export default LinkedinSearch;
