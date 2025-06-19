
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Users, FileText, BarChart3, Settings, Plus, Filter, Download } from 'lucide-react';
import Header from '@/components/Header';
import UploadSection from '@/components/UploadSection';
import CandidateTable from '@/components/CandidateTable';
import StatsCards from '@/components/StatsCards';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'upload', label: 'Upload Resumes', icon: Upload },
            { id: 'candidates', label: 'Candidates', icon: Users },
            { id: 'forms', label: 'Application Forms', icon: FileText },
          ].map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={activeTab === id ? 'default' : 'outline'}
              onClick={() => setActiveTab(id)}
              className="flex items-center gap-2"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Button>
          ))}
        </div>

        {/* Content based on active tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  HR Screening Dashboard
                </h1>
                <p className="text-gray-600">
                  Automate candidate screening with AI-powered resume analysis
                </p>
              </div>
              <Badge variant="secondary" className="px-3 py-1">
                Demo Mode - Connect Supabase for full functionality
              </Badge>
            </div>

            <StatsCards />

            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-indigo-600" />
                    Quick Upload
                  </CardTitle>
                  <CardDescription>
                    Upload multiple resumes and get instant AI analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => setActiveTab('upload')} 
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    Start Screening Process
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    Application Forms
                  </CardTitle>
                  <CardDescription>
                    Create custom forms for candidate submissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => setActiveTab('forms')} 
                    variant="outline" 
                    className="w-full"
                  >
                    Build New Form
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { action: 'Processed 15 resumes', time: '2 hours ago', status: 'completed' },
                    { action: 'Created "Software Engineer" form', time: '5 hours ago', status: 'active' },
                    { action: 'Exported candidate data', time: '1 day ago', status: 'completed' },
                  ].map((activity, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">{activity.action}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={activity.status === 'completed' ? 'secondary' : 'default'}>
                          {activity.status}
                        </Badge>
                        <span className="text-sm text-gray-500">{activity.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'upload' && <UploadSection />}
        
        {activeTab === 'candidates' && <CandidateTable />}
        
        {activeTab === 'forms' && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Form Builder Coming Soon
            </h3>
            <p className="text-gray-500 mb-6">
              Create custom application forms with our drag-and-drop builder
            </p>
            <Button disabled className="bg-gray-300">
              <Plus className="w-4 h-4 mr-2" />
              Create New Form
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
