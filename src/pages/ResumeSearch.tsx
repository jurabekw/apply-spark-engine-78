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

// Types
type Candidate = {
  title: string;
  experience: string;
  education_level: string;
  AI_score: string;
  key_skills: string[];
  alternate_url: string;
};

// Validation Schema
const schema = z.object({
  jobTitle: z.string().min(2, "Please enter at least 2 characters"),
  requiredSkills: z
    .string()
    .transform((s) => s.replace(/\s*,\s*/g, ", "))
    .refine((s) => s.split(",").map((t) => t.trim()).filter(Boolean).length > 0, {
      message: "Please enter skills separated by commas",
    }),
  experienceLevel: z.enum(["noExperience", "between1And3", "between3And6", "moreThan6"]),
});

// Helpers
const parseScore = (score: string): number => {
  const m = score.match(/\d{1,3}/);
  if (!m) return 0;
  const n = Math.min(100, parseInt(m[0]!, 10));
  return n;
};

const scoreTone = (n: number) => {
  if (n >= 80) return { bg: "bg-success", text: "text-success-foreground" };
  if (n >= 60) return { bg: "bg-warning", text: "text-warning-foreground" };
  return { bg: "bg-destructive", text: "text-destructive-foreground" };
};

const WEBHOOK_URL = "https://hook.eu2.make.com/rqe1ozj0uxqwb8cf19i1prbwhi8fdalk";

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit & { timeout?: number } = {}) {
  const { timeout = 60000, ...rest } = init;
  if ((AbortSignal as any).timeout) {
    return fetch(input, { ...rest, signal: (AbortSignal as any).timeout(timeout) });
  }
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(input, { ...rest, signal: controller.signal });
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

  // Form
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      jobTitle: "",
      requiredSkills: "",
      experienceLevel: "between1And3",
    },
  });

  // State
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [error, setError] = useState<string | null>(null);
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
      setLoadingStep((s) => (s + 1) % steps);
    }, 8000);
    return () => {
      if (stepTimer.current) window.clearInterval(stepTimer.current);
    };
  }, [loading]);

  // Share link (encodes current form)
  const shareLink = useMemo(() => {
    const v = form.getValues();
    const params = new URLSearchParams({
      title: v.jobTitle,
      skills: v.requiredSkills,
      exp: v.experienceLevel,
    });
    return `${window.location.origin}/resume-search?${params.toString()}`;
  }, [form.watch(["jobTitle", "requiredSkills", "experienceLevel"])]) as string;

  // Prefill from URL
  useEffect(() => {
    const url = new URL(window.location.href);
    const title = url.searchParams.get("title") ?? "";
    const skills = url.searchParams.get("skills") ?? "";
    const exp = (url.searchParams.get("exp") as any) ?? "between1And3";
    form.reset({ jobTitle: title, requiredSkills: skills, experienceLevel: exp });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (values: z.infer<typeof schema>) => {
    setLoading(true);
    setError(null);
    setCandidates([]);

    try {
      const response = await fetchWithTimeout(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_title: values.jobTitle.trim(),
          required_skills: values.requiredSkills.trim(),
          experience_level: values.experienceLevel,
        }),
        timeout: 60000,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status === "success" && Array.isArray(data.candidates)) {
        setCandidates(data.candidates);
        if (data.candidates.length === 0) {
          setError("No candidates found matching your criteria. Try adjusting your requirements.");
        }
      } else {
        throw new Error("Invalid response format");
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

  const LoadingStatus = () => (
    <div className="mt-6 rounded-md border bg-card p-4 text-sm">
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" aria-label="Loading spinner" />
        <span>Searching HH candidates...</span>
      </div>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">
        <li className={loadingStep === 0 ? "text-foreground" : ""}>Connecting to HH.ru...</li>
        <li className={loadingStep === 1 ? "text-foreground" : ""}>Analyzing resumes with AI...</li>
        <li className={loadingStep === 2 ? "text-foreground" : ""}>Preparing results...</li>
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">This usually takes 30-60 seconds</p>
    </div>
  );

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">HH Candidate Search</h1>
        <p className="text-muted-foreground">Find HH.ru candidates by role, skills, and experience — scored by AI.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Search Candidates</CardTitle>
          <CardDescription>Enter your requirements below</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Software Developer, Marketing Manager" aria-label="Job Title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experienceLevel"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel>Experience Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger aria-label="Experience Level">
                          <SelectValue placeholder="Select experience" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="noExperience">No Experience</SelectItem>
                        <SelectItem value="between1And3">1-3 Years</SelectItem>
                        <SelectItem value="between3And6">3-6 Years</SelectItem>
                        <SelectItem value="moreThan6">6+ Years</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requiredSkills"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Required Skills</FormLabel>
                    <FormControl>
                      <Textarea rows={4} placeholder="Enter skills separated by commas (e.g. JavaScript, React, Node.js, Python)" aria-label="Required Skills" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Separate multiple skills with commas</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                <Button type="submit" variant="brand" disabled={loading} aria-disabled={loading}>
                  {loading ? "Searching HH.ru..." : "Search candidates"}
                </Button>
                <button
                  type="button"
                  className="text-sm text-primary underline-offset-4 hover:underline"
                  onClick={() => navigator.clipboard.writeText(shareLink)}
                  aria-label="Copy shareable link"
                >
                  Copy shareable link
                </button>
              </div>

              {loading && (
                <div className="md:col-span-2">
                  <LoadingStatus />
                </div>
              )}

              {error && !loading && (
                <div className="md:col-span-2 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-destructive">
                  {error}
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Results */}
      <section className="mt-8">
        {!loading && !error && candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-10 text-center">
            <img
              src="/placeholder.svg"
              alt="Empty state illustration for resume search"
              loading="lazy"
              className="mb-4 h-24 w-24 opacity-70"
            />
            <h2 className="text-lg font-semibold">Enter job requirements above to find matching candidates</h2>
            <p className="text-sm text-muted-foreground">We’ll fetch resumes from HH.ru and score them for you.</p>
          </div>
        ) : null}

        {candidates.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {candidates.map((c, idx) => {
              const n = parseScore(c.AI_score);
              const tone = scoreTone(n);
              return (
                <Card key={`${c.alternate_url}-${idx}`} className="transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-xl font-bold leading-tight">{c.title}</CardTitle>
                      <Badge className={`${tone.bg} ${tone.text} border-transparent`}>{n}%</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm">
                      <div>📅 <span className="font-medium">Experience:</span> {c.experience}</div>
                      <div>🎓 <span className="font-medium">Education:</span> {c.education_level}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {c.key_skills?.map((s, i) => (
                        <Badge key={i} variant="secondary" className="bg-accent text-accent-foreground">
                          {s}
                        </Badge>
                      ))}
                    </div>
                    <div className="pt-2">
                      <a
                        href={c.alternate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
                        aria-label="View resume on HH.ru"
                      >
                        View Resume <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
