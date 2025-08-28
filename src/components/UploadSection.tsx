import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, X, Plus, CloudUpload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeFilename, generateUniqueFilename } from '@/utils/fileUtils';
import AnalysisHistory from '@/components/AnalysisHistory';
import { useTranslation } from 'react-i18next';
const UploadSection = () => {
  const [jobTitle, setJobTitle] = useState('');
  const [jobRequirements, setJobRequirements] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();
  const validateAndSetFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const pdfFiles = fileArray.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== fileArray.length) {
      toast({
        title: t('upload.invalidFileType'),
        description: t('upload.onlyPdfFiles'),
        variant: "destructive"
      });
      return false;
    }
    
    if (pdfFiles.length > 10) {
      toast({
        title: t('upload.tooManyFiles'),
        description: t('upload.maxTenFiles'),
        variant: "destructive"
      });
      return false;
    }

    const dataTransfer = new DataTransfer();
    pdfFiles.forEach(file => dataTransfer.items.add(file));
    setSelectedFiles(dataTransfer.files);
    return true;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      validateAndSetFiles(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      validateAndSetFiles(files);
    }
  };

  const removeFile = (indexToRemove: number) => {
    if (!selectedFiles) return;
    
    const remainingFiles = Array.from(selectedFiles).filter((_, index) => index !== indexToRemove);
    const dataTransfer = new DataTransfer();
    remainingFiles.forEach(file => dataTransfer.items.add(file));
    setSelectedFiles(dataTransfer.files.length > 0 ? dataTransfer.files : null);
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
        title: t('upload.noFilesSelected'),
        description: t('upload.selectPdfFiles'),
        variant: "destructive"
      });
      return;
    }
    if (!jobTitle.trim() || !jobRequirements.trim()) {
      toast({
        title: t('upload.missingInformation'),
        description: t('upload.provideTitleAndRequirements'),
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    setProcessingProgress([]);
    const files = Array.from(selectedFiles);
    
    try {
      // Step 1: Upload all resumes
      setProcessingProgress([t('upload.uploadingResumes')]);
      const uploadedResumes = await uploadAllResumes(files);
      setProcessingProgress(prev => [...prev, `✅ Uploaded ${uploadedResumes.length} resume${uploadedResumes.length > 1 ? 's' : ''}`]);
      
      // Step 2: Process all resumes together
      setProcessingProgress(prev => [...prev, t('upload.analyzingWithAi')]);
      const result = await processAllResumes(uploadedResumes);
      
      if (result.success) {
        const candidateCount = result.candidates?.length || 0;
        setProcessingProgress(prev => [...prev, `✅ Successfully processed ${candidateCount} candidate${candidateCount > 1 ? 's' : ''}`]);
        
        toast({
          title: t('upload.processingComplete'),
          description: `Successfully analyzed ${candidateCount} candidate${candidateCount > 1 ? 's' : ''} from ${files.length} resume${files.length > 1 ? 's' : ''}.`
        });
        
        // Reset form on success
        setSelectedFiles(null);
        setJobTitle('');
        setJobRequirements('');
        // Reset file input
        const fileInput = document.getElementById('resume-files') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        // Trigger refresh of analysis history
        window.dispatchEvent(new CustomEvent('analysis-completed'));
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
        title: t('upload.processingFailed'),
        description: displayError,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Modern Upload Card */}
      <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-xl">
              <CloudUpload className="w-6 h-6 text-white" />
            </div>
            {t('upload.title')}
          </CardTitle>
          <p className="text-muted-foreground">
            {t('upload.subtitle')}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job Details */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="job-title" className="text-sm font-medium">{t('upload.positionTitle')}</Label>
                <Input 
                  id="job-title" 
                  placeholder={t('upload.positionPlaceholder')}
                  value={jobTitle} 
                  onChange={e => setJobTitle(e.target.value)} 
                  disabled={isProcessing} 
                  required 
                  className="h-12"
                />
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-medium">{t('upload.requirementsAndSkills')}</Label>
                <Textarea 
                  placeholder={t('upload.requirementsPlaceholder')}
                  value={jobRequirements} 
                  onChange={e => setJobRequirements(e.target.value)} 
                  disabled={isProcessing} 
                  rows={3} 
                  required 
                  className="resize-none"
                />
              </div>
            </div>

            {/* Modern Dropzone */}
            <div 
              className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ${
                isDragOver 
                  ? 'border-primary bg-primary/5 scale-[1.02]' 
                  : selectedFiles?.length 
                    ? 'border-success bg-success/5' 
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input 
                id="resume-files" 
                type="file" 
                multiple 
                accept=".pdf" 
                onChange={handleFileSelect} 
                disabled={isProcessing} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              <div className="text-center">
                <div className={`inline-flex p-4 rounded-full mb-4 transition-colors ${
                  isDragOver ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  <Upload className="w-8 h-8" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-foreground">
                    {isDragOver ? t('upload.dropFilesHere') : t('upload.dragDropFiles')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    or <Button variant="link" className="p-0 h-auto text-primary">{t('upload.browseFiles')}</Button>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('upload.fileRestrictions')}
                  </p>
                </div>
              </div>
            </div>

            {/* Selected Files Preview */}
            {selectedFiles && selectedFiles.length > 0 && (
              <Card className="bg-success/5 border-success/20">
                <CardContent className="p-4">
                  <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    {t('upload.selectedFiles')} ({selectedFiles.length})
                  </h4>
                  <div className="grid gap-3">
                    {Array.from(selectedFiles).map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border/50">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg">
                            <FileText className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeFile(index)}
                          disabled={isProcessing}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Processing Status */}
            {processingProgress.length > 0 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <h4 className="font-medium text-primary mb-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('upload.processingStatus')}
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {processingProgress.map((message, index) => (
                      <div key={index} className="text-sm font-mono text-primary/80 flex items-start gap-2">
                        <div className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        {message}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              size="lg"
              className="w-full h-12" 
              disabled={isProcessing || !selectedFiles || selectedFiles.length === 0}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  {t('upload.analyzing')}
                </>
              ) : (
                <>
                  <CloudUpload className="w-5 h-5 mr-3" />
                  {t('upload.analyze')} {selectedFiles ? selectedFiles.length : 0} Resume{selectedFiles && selectedFiles.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </form>

          {/* Feature Highlight */}
          <Card className="bg-gradient-to-br from-success/5 to-emerald-500/5 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-gradient-to-br from-success to-emerald-500 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">{t('upload.aiPoweredAnalysisTitle')}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t('upload.aiAnalysisDescription')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
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