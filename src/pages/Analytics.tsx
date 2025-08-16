import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Filter, 
  Calendar,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Search,
  Award
} from 'lucide-react';
import { useAdvancedAnalytics } from '@/hooks/useAdvancedAnalytics';
import { AnalyticsSummary } from '@/components/analytics/AnalyticsSummary';
import { PerformanceChart } from '@/components/analytics/PerformanceChart';
import { SkillsAnalysis } from '@/components/analytics/SkillsAnalysis';
import { SearchPatterns } from '@/components/analytics/SearchPatterns';

export default function Analytics() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>();
  const { data, loading } = useAdvancedAnalytics(dateRange);

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting analytics data...');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Advanced Analytics</h1>
              <p className="text-muted-foreground">
                Comprehensive insights into your recruitment performance
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-16 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-64 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Advanced Analytics</h1>
          <p className="text-muted-foreground">
            No analytics data available. Start by uploading candidates or performing searches.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Advanced Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights into your recruitment performance and candidate data
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Date Range
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Section */}
      <AnalyticsSummary summary={data.summary} />

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-4">
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="skills" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Skills
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search Patterns
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Performance Analytics */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PerformanceChart 
              data={data.performanceMetrics} 
              type="line" 
              metric="candidates" 
            />
            <PerformanceChart 
              data={data.performanceMetrics} 
              type="bar" 
              metric="conversion" 
            />
          </div>
          
          <PerformanceChart 
            data={data.performanceMetrics} 
            type="line" 
            metric="score" 
          />
        </TabsContent>

        {/* Skills Analytics */}
        <TabsContent value="skills" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <SkillsAnalysis 
              data={data.skillsData} 
              viewType="frequency" 
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Scoring Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <SkillsAnalysis 
                    data={data.skillsData} 
                    viewType="score" 
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Skills by Source</CardTitle>
                </CardHeader>
                <CardContent>
                  <SkillsAnalysis 
                    data={data.skillsData} 
                    viewType="distribution" 
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Search Patterns */}
        <TabsContent value="search" className="space-y-6">
          <SearchPatterns 
            data={data.searchPatterns} 
            viewType="trends" 
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Most Popular Searches</CardTitle>
              </CardHeader>
              <CardContent>
                <SearchPatterns 
                  data={data.searchPatterns} 
                  viewType="popularity" 
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Search Effectiveness</CardTitle>
              </CardHeader>
              <CardContent>
                <SearchPatterns 
                  data={data.searchPatterns} 
                  viewType="effectiveness" 
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insights & Recommendations */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recruitment Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Recruitment Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900">Source Performance</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      {data.performanceMetrics.length > 0 ? (
                        `Your most effective source is generating ${Math.max(...data.performanceMetrics.map(p => p.total_candidates))} candidates per batch.`
                      ) : (
                        'Start recruiting to see source performance insights.'
                      )}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900">Quality Metrics</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Average AI score of {data.summary.avgAiScore.toFixed(1)} indicates 
                      {data.summary.avgAiScore >= 75 ? ' excellent' : data.summary.avgAiScore >= 60 ? ' good' : ' improving'} candidate quality.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-900">Optimization Tip</h4>
                    <p className="text-sm text-purple-700 mt-1">
                      Focus on {data.summary.topSkills[0] || 'technical skills'} to improve candidate matching accuracy.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Market Intelligence */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Market Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="font-medium text-orange-900">Trending Skills</h4>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {data.summary.topSkills.slice(0, 3).map(skill => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <h4 className="font-medium text-indigo-900">Hot Roles</h4>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {data.summary.mostSearchedRoles.slice(0, 2).map(role => (
                        <Badge key={role} variant="secondary" className="text-xs">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-yellow-900">Recommendations</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      {data.summary.conversionRate < 10 
                        ? 'Consider refining search criteria to improve conversion rates.'
                        : 'Your conversion rate is healthy. Focus on scaling successful patterns.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}