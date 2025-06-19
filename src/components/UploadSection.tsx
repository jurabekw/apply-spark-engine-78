
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Zap, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const UploadSection = () => {
  const [jobTitle, setJobTitle] = useState('');
  const [requirements, setRequirements] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { toast } = useToast();

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

  const handleProcessResumes = () => {
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

    toast({
      title: "Processing started",
      description: "Connect Supabase to enable AI-powered resume analysis.",
    });
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
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Label htmlFor="file-upload">
                  <Button variant="outline" className="cursor-pointer">
                    Choose Files
                  </Button>
                </Label>
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
                Ready to Process Resumes?
              </h3>
              <p className="text-sm text-gray-600">
                AI will analyze and rank candidates based on your requirements
              </p>
            </div>
            <Button 
              onClick={handleProcessResumes}
              className="bg-indigo-600 hover:bg-indigo-700"
              size="lg"
            >
              <Zap className="w-4 h-4 mr-2" />
              Process with AI
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800 mb-1">
                Connect Supabase for Full Functionality
              </h4>
              <p className="text-sm text-amber-700">
                To enable AI-powered resume parsing, candidate scoring, and data storage, 
                please connect your project to Supabase using the integration button.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadSection;
