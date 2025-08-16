import React, { useState } from 'react';
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

import { LinkedinSearchTable } from '@/components/LinkedinSearchTable';
import { LinkedinSearchHistory } from '@/components/LinkedinSearchHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Clock, Settings, Linkedin } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const searchSchema = z.object({
  job_title: z.string().min(1, "Please describe what candidate you're looking for"),
});

type SearchFormData = z.infer<typeof searchSchema>;

const LinkedinSearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [lastSearch, setLastSearch] = useState<SearchFormData | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      job_title: '',
    },
  });

  const normalizeCandidates = (response: any): any[] => {
    if (!response) return [];

    // Preprocess webhook response format: check for output arrays containing JSON strings
    let processedResponse = response;
    
    // Handle case where response is an array containing objects with 'output' property
    if (Array.isArray(response)) {
      let allCandidates: any[] = [];
      
      for (const item of response) {
        if (item && typeof item === 'object' && item.output && Array.isArray(item.output)) {
          // Parse each JSON string in the output array
          for (const jsonString of item.output) {
            if (typeof jsonString === 'string') {
              try {
                // Clean the JSON string (remove extra whitespace/newlines)
                const cleanedJson = jsonString.trim();
                const parsedObject = JSON.parse(cleanedJson);
                
                // Extract candidates from the parsed object
                if (parsedObject.candidates && Array.isArray(parsedObject.candidates)) {
                  allCandidates.push(...parsedObject.candidates);
                } else if (Array.isArray(parsedObject)) {
                  allCandidates.push(...parsedObject);
                } else {
                  allCandidates.push(parsedObject);
                }
              } catch (error) {
                console.warn('Failed to parse JSON string in output array:', error, jsonString);
              }
            }
          }
        } else {
          // If item doesn't have output property, add it directly
          allCandidates.push(item);
        }
      }
      
      processedResponse = allCandidates;
    }

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

    const rawCandidates = extractCandidates(processedResponse);

    return rawCandidates.map((candidate, index) => ({
      title: toStr(candidate.title || candidate.name || `Candidate ${index + 1}`),
      experience: toStr(candidate.experience || candidate.experience_level || candidate.seniority || ''),
      AI_score: toStr(candidate.AI_score || candidate.ai_score || candidate.score || '0'),
      key_skills: toSkills(candidate.key_skills || candidate.skills || candidate.technologies || []),
      alternate_url: toStr(candidate.alternate_url || candidate.linkedin_url || candidate.profile_url || candidate.url || ''),
      raw_data: candidate
    }));
  };

  const onSubmit = async (data: SearchFormData) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to search for candidates.",
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
      const webhookResponse = await fetch(`https://sadasd1.app.n8n.cloud/webhook-test/463633d4-a16f-49d7-b0c6-c7e0c53f9013?${queryParams.toString()}`, {
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
          title: "Warning",
          description: "Search completed but couldn't save to history.",
          variant: "destructive",
        });
      }

      setSearchResults(normalizedCandidates);
      setLastSearch(data);

      toast({
        title: "Search completed!",
        description: `Found ${normalizedCandidates.length} candidates matching your criteria.`,
      });

      // Trigger refresh of search history
      window.dispatchEvent(new CustomEvent('linkedin-search-completed'));

    } catch (error) {
      console.error('LinkedIn search error:', error);
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
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
    <div className="min-h-screen bg-background">
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
            <Linkedin className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">LinkedIn Candidate Search</h1>
            <p className="text-gray-600">Find qualified candidates on LinkedIn</p>
          </div>
        </div>

        <Tabs defaultValue="search" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search" className="gap-2">
              <Search className="h-4 w-4" />
              Search
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Clock className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>What candidate are you looking for?</CardTitle>
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
                               placeholder="5 Marketing specialists in Uzbekistan"
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
                           Searching LinkedIn...
                         </div>
                       ) : (
                         <div className="flex items-center gap-2">
                           <Search className="h-4 w-4" />
                           Search LinkedIn
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
                    Search Results
                    <Badge variant="secondary">{searchResults.length} candidates</Badge>
                  </CardTitle>
                   <div className="text-sm text-gray-600">
                     <p><strong>Search Query:</strong> {lastSearch.job_title}</p>
                   </div>
                </CardHeader>
                <CardContent>
                  <LinkedinSearchTable candidates={searchResults} loading={isLoading} />
                </CardContent>
              </Card>
            )}

          </TabsContent>

          <TabsContent value="history">
            <LinkedinSearchHistory onRerunSearch={handleRerunSearch} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LinkedinSearch;