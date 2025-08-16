import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Target, 
  TrendingUp, 
  Brain,
  Search,
  Award,
  Calendar,
  Briefcase
} from 'lucide-react';

interface AnalyticsSummaryProps {
  summary: {
    totalCandidates: number;
    avgAiScore: number;
    topSkills: string[];
    mostSearchedRoles: string[];
    conversionRate: number;
  };
}

export const AnalyticsSummary: React.FC<AnalyticsSummaryProps> = ({
  summary,
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConversionColor = (rate: number) => {
    if (rate >= 20) return 'text-green-600';
    if (rate >= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const metrics = [
    {
      title: 'Total Candidates',
      value: summary.totalCandidates.toLocaleString(),
      icon: Users,
      description: 'Total candidates processed',
      color: 'text-blue-600',
    },
    {
      title: 'Average AI Score',
      value: `${summary.avgAiScore.toFixed(1)}/100`,
      icon: Brain,
      description: 'Average matching score',
      color: getScoreColor(summary.avgAiScore),
    },
    {
      title: 'Conversion Rate',
      value: `${summary.conversionRate.toFixed(1)}%`,
      icon: Target,
      description: 'Candidates to shortlisted',
      color: getConversionColor(summary.conversionRate),
    },
    {
      title: 'Top Skills Count',
      value: summary.topSkills.length.toString(),
      icon: Award,
      description: 'Most in-demand skills',
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <metric.icon className={`h-5 w-5 ${metric.color}`} />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </p>
                  <p className={`text-2xl font-bold ${metric.color}`}>
                    {metric.value}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {metric.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Top Skills in Demand
            </CardTitle>
            <CardDescription>
              Most frequently appearing skills across all candidates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {summary.topSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {summary.topSkills.map((skill, index) => (
                  <Badge 
                    key={skill}
                    variant={index < 3 ? "default" : "secondary"}
                    className="text-sm"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No skills data available yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Most Searched Roles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Most Searched Roles
            </CardTitle>
            <CardDescription>
              Job titles with the highest search frequency
            </CardDescription>
          </CardHeader>
          <CardContent>
            {summary.mostSearchedRoles.length > 0 ? (
              <div className="space-y-2">
                {summary.mostSearchedRoles.map((role, index) => (
                  <div key={role} className="flex items-center justify-between">
                    <Badge variant={index < 2 ? "default" : "secondary"}>
                      {role}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      #{index + 1}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No search data available yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Indicators
          </CardTitle>
          <CardDescription>
            Key performance metrics and benchmarks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* AI Score Performance */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">AI Matching Score</span>
              <span className={`text-sm font-bold ${getScoreColor(summary.avgAiScore)}`}>
                {summary.avgAiScore.toFixed(1)}/100
              </span>
            </div>
            <Progress 
              value={summary.avgAiScore} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              {summary.avgAiScore >= 80 ? 'Excellent matching accuracy' :
               summary.avgAiScore >= 60 ? 'Good matching performance' :
               'Room for improvement in candidate matching'}
            </p>
          </div>

          {/* Conversion Rate Performance */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Conversion Rate</span>
              <span className={`text-sm font-bold ${getConversionColor(summary.conversionRate)}`}>
                {summary.conversionRate.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={Math.min(summary.conversionRate, 100)} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              {summary.conversionRate >= 20 ? 'High conversion rate' :
               summary.conversionRate >= 10 ? 'Average conversion rate' :
               'Low conversion rate - consider refining criteria'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Quick Insights
          </CardTitle>
          <CardDescription>
            AI-generated insights based on your recruitment data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {summary.totalCandidates > 0 && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <p className="text-sm">
                  You've processed <strong>{summary.totalCandidates}</strong> candidates 
                  with an average AI score of <strong>{summary.avgAiScore.toFixed(1)}</strong>.
                </p>
              </div>
            )}
            
            {summary.conversionRate > 0 && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                <p className="text-sm">
                  Your conversion rate of <strong>{summary.conversionRate.toFixed(1)}%</strong> 
                  {summary.conversionRate >= 15 
                    ? ' is above industry average.' 
                    : ' has room for improvement.'}
                </p>
              </div>
            )}

            {summary.topSkills.length > 0 && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                <p className="text-sm">
                  <strong>{summary.topSkills[0]}</strong> is the most in-demand skill 
                  in your candidate pool.
                </p>
              </div>
            )}

            {summary.mostSearchedRoles.length > 0 && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                <p className="text-sm">
                  <strong>{summary.mostSearchedRoles[0]}</strong> is your most frequently 
                  searched job title.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};