
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
import { extractTextFromPDF } from '@/utils/fileUtils';

const UploadSection = () => {
  const [jobTitle, setJobTitle] = useState('');
  const [jobRequirements, setJobRequirements] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<string[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Filter for PDF files only
      const pdfFiles = Array.from(files).filter(file => 
        file.type === 'application/pdf'
      );
      
      if (pdfFiles.length !== files.length) {
        toast({
          title: "Invalid file type",
          description: "Please select only PDF files.",
          variant: "destructive",
        });
        return;
      }

      if (pdfFiles.length > 10) {
        toast({
          title: "Too many files",
          description: "Please select maximum 10 files at once.",
          variant: "destructive",
        });
        return;
      }

      // Create a new FileList-like object with only PDF files
      const dataTransfer = new DataTransfer();
      pdfFiles.forEach(file => dataTransfer.items.add(file));
      setSelectedFiles(dataTransfer.files);
    }
  };

  const processResume = async (file: File) => {
    try {
      // Extract text from PDF
      const resumeText = await extractTextFromPDF(file);
      
      if (!resumeText || resumeText.trim().length < 50) {
        throw new Error('Could not extract sufficient text from the PDF. Please ensure the file is not password protected or image-only.');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${user?.id}_${timestamp}_${safeFilename}`;
      const filePath = `${user?.id}/${filename}`;

      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      // Process resume with AI
      const { data, error } = await supabase.functions.invoke('process-resume', {
        body: {
          resumeText,
          jobRequirements,
          jobTitle,
          userId: user?.id,
          resumeFilePath: filePath,
          originalFilename: file.name
        }
      });

      if (error) {
        console.error('Processing error:', error);
        // Clean up uploaded file on processing error
        await supabase.storage.from('resumes').remove([filePath]);
        throw new Error(error.message || 'Failed to process resume');
      }

      if (!data.success) {
        // Clean up uploaded file on processing failure
        await supabase.storage.from('resumes').remove([filePath]);
        throw new Error(data.error || 'Resume processing failed');
      }

      return {
        success: true,
        filename: file.name,
        candidate: data.candidate
      };

    } catch (error) {
      console.error('Error processing resume:', error);
      return {
        success: false,
        filename: file.name,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFiles || selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one PDF file to process.",
        variant: "destructive",
      });
      return;
    }

    if (!jobTitle.trim() || !jobRequirements.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both job title and requirements.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProcessingProgress([]);
    
    const files = Array.from(selectedFiles);
    let successCount = 0;
    let failureCount = 0;
    const failedFiles: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProcessingProgress(prev => [...prev, `Processing ${file.name}...`]);
        
        const result = await processResume(file);
        
        if (result.success) {
          successCount++;
          setProcessingProgress(prev => [
            ...prev.slice(0, -1), 
            `✅ ${file.name} - Processed successfully`
          ]);
        } else {
          failureCount++;
          failedFiles.push(file.name);
          setProcessingProgress(prev => [
            ...prev.slice(0, -1), 
            `❌ ${file.name} - ${result.error}`
          ]);
        }
      }

      // Show final results
      if (successCount > 0 && failureCount === 0) {
        toast({
          title: "Processing Complete!",
          description: `Successfully processed ${successCount} resume${successCount > 1 ? 's' : ''}.`,
        });
      } else if (successCount > 0 && failureCount > 0) {
        toast({
          title: "Partial Success",
          description: `Processed ${successCount} resume${successCount > 1 ? 's' : ''} successfully. ${failureCount} failed.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Processing Failed",
          description: `Failed to process all ${failureCount} resume${failureCount > 1 ? 's' : ''}. Please check the files and try again.`,
          variant: "destructive",
        });
      }

      // Reset form on success
      if (successCount > 0) {
        setSelectedFiles(null);
        setJobTitle('');
        setJobRequirements('');
        // Reset file input
        const fileInput = document.getElementById('resume-files') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }

    } catch (error) {
      console.error('Batch processing error:', error);
      toast({
        title: "Processing Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
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
              <Input
                id="job-title"
                placeholder="e.g., Senior Frontend Developer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                disabled={isProcessing}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resume-files">Resume Files (PDF only)</Label>
              <Input
                id="resume-files"
                type="file"
                multiple
                accept=".pdf"
                onChange={handleFileSelect}
                disabled={isProcessing}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">Job Requirements & Skills</Label>
            <Textarea
              id="requirements"
              placeholder="Describe the key requirements, skills, and qualifications for this position..."
              value={jobRequirements}
              onChange={(e) => setJobRequirements(e.target.value)}
              disabled={isProcessing}
              rows={4}
              required
            />
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

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isProcessing || !selectedFiles || selectedFiles.length === 0}
          >
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

export default UploadSection;
