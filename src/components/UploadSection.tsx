import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeFilename, generateUniqueFilename } from '@/utils/fileUtils';
import AnalysisHistory from '@/components/AnalysisHistory';
const UploadSection = () => {
  const [jobTitle, setJobTitle] = useState('');
  const [jobRequirements, setJobRequirements] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<string[]>([]);
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Filter for PDF files only
      const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
      if (pdfFiles.length !== files.length) {
        toast({
          title: "Invalid file type",
          description: "Please select only PDF files.",
          variant: "destructive"
        });
        return;
      }
      if (pdfFiles.length > 10) {
        toast({
          title: "Too many files",
          description: "Please select maximum 10 files at once.",
          variant: "destructive"
        });
        return;
      }

      // Create a new FileList-like object with only PDF files
      const dataTransfer = new DataTransfer();
      pdfFiles.forEach(file => dataTransfer.items.add(file));
      setSelectedFiles(dataTransfer.files);
    }
  };
  const uploadAllResumes = async (files: File[]) => {
    const uploadedResumes = [];
    
    for (const file of files) {
      try {
        // Generate unique filename using our utility
        const filename = generateUniqueFilename(file.name, user?.id || 'anonymous');
        const filePath = `${user?.id}/${filename}`;
        console.log(`Uploading file: ${file.name} (${file.size} bytes) to ${filePath}`);

        // Upload file to Supabase storage
        const { error: uploadError } = await supabase.storage.from('resumes').upload(filePath, file);
        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Failed to upload file: ${uploadError.message}`);
        }
        console.log('File uploaded successfully');

        uploadedResumes.push({
          filePath,
          originalFilename: file.name
        });
      } catch (error) {
        console.error('Error uploading resume:', error);
        // Clean up any uploaded files on error
        for (const uploaded of uploadedResumes) {
          await supabase.storage.from('resumes').remove([uploaded.filePath]);
        }
        throw error;
      }
    }
    
    return uploadedResumes;
  };

  const processAllResumes = async (uploadedResumes: Array<{filePath: string, originalFilename: string}>) => {
    try {
      console.log('Processing all resumes with AI...');

      // Process all resumes with AI via Make.com webhook
      const { data, error } = await supabase.functions.invoke('process-resume', {
        body: {
          jobRequirements,
          jobTitle,
          userId: user?.id,
          uploadedResumes
        }
      });
      
      if (error) {
        console.error('Processing error:', error);
        // Clean up uploaded files on processing error
        for (const resume of uploadedResumes) {
          await supabase.storage.from('resumes').remove([resume.filePath]);
        }
        throw new Error(error.message || 'Failed to process resumes');
      }
      
      if (!data.success) {
        // Clean up uploaded files on processing failure
        for (const resume of uploadedResumes) {
          await supabase.storage.from('resumes').remove([resume.filePath]);
        }
        throw new Error(data.error || 'Resume processing failed');
      }
      
      return {
        success: true,
        candidates: data.candidates
      };
    } catch (error) {
      console.error('Error processing resumes:', error);
      throw error;
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFiles || selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one PDF file to process.",
        variant: "destructive"
      });
      return;
    }
    if (!jobTitle.trim() || !jobRequirements.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both job title and requirements.",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    setProcessingProgress([]);
    const files = Array.from(selectedFiles);
    
    try {
      // Step 1: Upload all resumes
      setProcessingProgress(['Uploading all resumes...']);
      const uploadedResumes = await uploadAllResumes(files);
      setProcessingProgress(prev => [...prev, `✅ Uploaded ${uploadedResumes.length} resume${uploadedResumes.length > 1 ? 's' : ''}`]);
      
      // Step 2: Process all resumes together
      setProcessingProgress(prev => [...prev, 'Analyzing resumes with AI...']);
      const result = await processAllResumes(uploadedResumes);
      
      if (result.success) {
        const candidateCount = result.candidates?.length || 0;
        setProcessingProgress(prev => [...prev, `✅ Successfully processed ${candidateCount} candidate${candidateCount > 1 ? 's' : ''}`]);
        
        toast({
          title: "Processing Complete!",
          description: `Successfully analyzed ${candidateCount} candidate${candidateCount > 1 ? 's' : ''} from ${files.length} resume${files.length > 1 ? 's' : ''}.`
        });
        
        // Reset form on success
        setSelectedFiles(null);
        setJobTitle('');
        setJobRequirements('');
        // Reset file input
        const fileInput = document.getElementById('resume-files') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (error) {
      console.error('Processing error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      
      let displayError = errorMsg;
      // Make errors more user-friendly
      if (errorMsg.includes('quota exceeded') || errorMsg.includes('429')) {
        displayError = 'API quota exceeded - try again later';
      } else if (errorMsg.includes('authentication') || errorMsg.includes('401') || errorMsg.includes('403')) {
        displayError = 'API key authentication failed';
      } else if (errorMsg.includes('temporarily unavailable') || errorMsg.includes('500')) {
        displayError = 'Service temporarily unavailable';
      }
      
      setProcessingProgress(prev => [...prev, `❌ ${displayError}`]);
      
      toast({
        title: "Processing Failed",
        description: displayError,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload & Process Resumes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="job-title">Job Title</Label>
              <Input id="job-title" placeholder="e.g., Senior Frontend Developer" value={jobTitle} onChange={e => setJobTitle(e.target.value)} disabled={isProcessing} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resume-files">Resume Files (PDF only)</Label>
              <Input id="resume-files" type="file" multiple accept=".pdf" onChange={handleFileSelect} disabled={isProcessing} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">Job Requirements & Skills</Label>
            <Textarea id="requirements" placeholder="Describe the key requirements, skills, and qualifications for this position..." value={jobRequirements} onChange={e => setJobRequirements(e.target.value)} disabled={isProcessing} rows={4} required />
          </div>

          {selectedFiles && selectedFiles.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Selected Files ({selectedFiles.length}):</h4>
              <div className="space-y-1">
                {Array.from(selectedFiles).map((file, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4" />
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                ))}
              </div>
            </div>
          )}

          {processingProgress.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Processing Status:</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {processingProgress.map((message, index) => (
                  <div key={index} className="text-sm text-blue-700 font-mono">
                    {message}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isProcessing || !selectedFiles || selectedFiles.length === 0}>
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing Resumes...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Process {selectedFiles ? selectedFiles.length : 0} Resume{selectedFiles && selectedFiles.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-green-900 mb-1">AI-Powered Analysis</h4>
              <p className="text-sm text-green-700">
                Our system will automatically extract candidate information, calculate experience, 
                identify skills, and provide an AI-powered match score for each resume against your job requirements.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const UploadSectionWithHistory = () => {
  return (
    <div className="space-y-8">
      <UploadSection />
      {/* Analysis History Section */}
      <AnalysisHistory />
    </div>
  );
};

export default UploadSectionWithHistory;