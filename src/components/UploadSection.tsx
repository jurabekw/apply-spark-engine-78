import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Zap, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useJobPostings } from '@/hooks/useJobPostings';

const UploadSection = () => {
  const [jobTitle, setJobTitle] = useState('');
  const [requirements, setRequirements] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { createJobPosting, jobPostings } = useJobPostings();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== files.length) {
      toast({
        title: "Invalid file type",
        description: "Please upload only PDF files.",
        variant: "destructive",
      });
    }
    
    setUploadedFiles(prev => [...prev, ...pdfFiles]);
    
    if (pdfFiles.length > 0) {
      toast({
        title: "Files uploaded successfully",
        description: `${pdfFiles.length} PDF files ready for processing.`,
      });
    }
  };

  const handleChooseFilesClick = () => {
    fileInputRef.current?.click();
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    // For demo purposes, we'll simulate PDF text extraction
    // In a real implementation, you'd use a PDF parsing library
    return `Resume content for ${file.name}\n\nThis is a simulated extraction of resume content. In a real implementation, this would contain the actual text content from the PDF file including personal information, work experience, education, and skills.`;
  };

  const uploadFileToStorage = async (file: File, userId: string): Promise<string> => {
    const fileName = `${userId}/${Date.now()}-${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('resumes')
      .upload(fileName, file);

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    return fileName;
  };

  const processResumeWithAI = async (file: File) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Upload file to storage
      const filePath = await uploadFileToStorage(file, user.id);
      
      // Extract text from PDF
      const resumeText = await extractTextFromPDF(file);
      
      // Call the Edge Function to process with AI
      const { data, error } = await supabase.functions.invoke('process-resume', {
        body: {
          resumeText,
          jobRequirements: requirements,
          jobTitle,
          userId: user.id,
          resumeFilePath: filePath,
        },
      });

      if (error) {
        throw new Error(error.message || 'AI processing failed');
      }

      if (!data.success) {
        throw new Error(data.error || 'Processing failed');
      }

      return data.candidate;
    } catch (error) {
      console.error('Error processing resume:', error);
      throw error;
    }
  };

  const handleProcessResumes = async () => {
    if (!jobTitle.trim() || !requirements.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in job title and requirements.",
        variant: "destructive",
      });
      return;
    }

    if (uploadedFiles.length === 0) {
      toast({
        title: "No files uploaded",
        description: "Please upload at least one resume.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    setProcessedCount(0);

    try {
      // Create job posting first if it doesn't exist
      const jobPosting = await createJobPosting({
        title: jobTitle,
        requirements,
        status: 'active',
      });

      if (!jobPosting) {
        throw new Error('Failed to create job posting');
      }

      toast({
        title: "Processing started",
        description: `Processing ${uploadedFiles.length} resumes with AI...`,
      });

      // Process each file
      const results = [];
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        try {
          const candidate = await processResumeWithAI(file);
          results.push({ success: true, candidate, fileName: file.name });
          setProcessedCount(i + 1);
        } catch (error) {
          console.error(`Failed to process ${file.name}:`, error);
          results.push({ success: false, error: error.message, fileName: file.name });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      toast({
        title: "Processing complete",
        description: `Successfully processed ${successCount} resumes. ${failureCount > 0 ? `${failureCount} failed.` : ''}`,
      });

      // Clear form
      setUploadedFiles([]);
      setJobTitle('');
      setRequirements('');

    } catch (error) {
      console.error('Error processing resumes:', error);
      toast({
        title: "Processing failed",
        description: error.message || "An error occurred during processing.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setProcessedCount(0);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          AI-Powered Resume Screening
        </h2>
        <p className="text-gray-600">
          Upload resumes and define job requirements for intelligent candidate matching
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Job Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Job Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                placeholder="e.g., Senior Software Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="mt-1"
                disabled={processing}
              />
            </div>
            
            <div>
              <Label htmlFor="requirements">Required Skills & Qualifications</Label>
              <Textarea
                id="requirements"
                placeholder="e.g., 5+ years experience, React, Node.js, TypeScript, Bachelor's degree in Computer Science..."
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                className="mt-1 min-h-[120px]"
                disabled={processing}
              />
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-600" />
              Upload Resumes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="space-y-2">
                <p className="text-gray-600">
                  Drag and drop PDF files here, or click to browse
                </p>
                <Input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={processing}
                />
                <Button 
                  variant="outline" 
                  onClick={handleChooseFilesClick}
                  disabled={processing}
                  type="button"
                >
                  Choose Files
                </Button>
              </div>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="font-medium text-gray-700">
                  Uploaded Files ({uploadedFiles.length})
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <FileText className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-gray-700 truncate">
                        {file.name}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {(file.size / 1024).toFixed(1)} KB
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Process Button */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                {processing ? 'Processing Resumes...' : 'Ready to Process Resumes?'}
              </h3>
              <p className="text-sm text-gray-600">
                {processing 
                  ? `Processing ${processedCount} of ${uploadedFiles.length} resumes...`
                  : 'AI will analyze and rank candidates based on your requirements'
                }
              </p>
            </div>
            <Button 
              onClick={handleProcessResumes}
              className="bg-indigo-600 hover:bg-indigo-700"
              size="lg"
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Process with AI
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Success Info */}
      {jobPostings.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800 mb-1">
                  System Ready
                </h4>
                <p className="text-sm text-green-700">
                  AI-powered resume processing is active. Upload resumes and define job requirements 
                  to get intelligent candidate analysis and scoring.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UploadSection;
