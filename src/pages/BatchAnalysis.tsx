import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { FileBarChart, Upload, Download, Play } from 'lucide-react'

const BatchAnalysis = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Batch Resume Analysis
        </h1>
        <p className="text-muted-foreground">
          Process multiple resumes simultaneously with AI-powered analysis
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Batch
            </CardTitle>
            <CardDescription>
              Upload multiple resume files for batch processing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                Drag and drop files here or click to browse
              </p>
              <Button>
                Choose Files
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Supported formats: PDF, DOC, DOCX • Max 50 files per batch
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileBarChart className="w-5 h-5" />
              Analysis Status
            </CardTitle>
            <CardDescription>
              Monitor the progress of your batch analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing Progress</span>
                <span>0/0</span>
              </div>
              <Progress value={0} className="w-full" />
            </div>
            <Button className="w-full" disabled>
              <Play className="w-4 h-4 mr-2" />
              Start Analysis
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Batch Jobs</CardTitle>
          <CardDescription>
            View and manage your previous batch analysis jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileBarChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No batch jobs yet</p>
            <p className="text-sm">Upload files to start your first batch analysis</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default BatchAnalysis