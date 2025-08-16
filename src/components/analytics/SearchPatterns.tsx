import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Badge } from '@/components/ui/badge';

interface SearchPatternData {
  job_title: string;
  experience_level: string;
  search_count: number;
  avg_candidates_found: number;
  week: string;
}

interface SearchPatternsProps {
  data: SearchPatternData[];
  viewType: 'trends' | 'popularity' | 'effectiveness';
}

const chartConfig = {
  search_count: {
    label: "Search Count",
    color: "hsl(var(--primary))",
  },
  avg_candidates_found: {
    label: "Avg Candidates Found",
    color: "hsl(var(--secondary))",
  },
  effectiveness: {
    label: "Search Effectiveness",
    color: "hsl(var(--accent))",
  },
};

export const SearchPatterns: React.FC<SearchPatternsProps> = ({
  data,
  viewType,
}) => {
  const formatWeek = (week: string) => {
    return new Date(week).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const processData = () => {
    if (viewType === 'trends') {
      // Group by week and aggregate search activity
      const weeklyData = data.reduce((acc, item) => {
        const week = formatWeek(item.week);
        if (!acc[week]) {
          acc[week] = { 
            week, 
            search_count: 0, 
            avg_candidates_found: 0, 
            searches: [] 
          };
        }
        acc[week].search_count += item.search_count;
        acc[week].searches.push(item.avg_candidates_found);
        return acc;
      }, {} as Record<string, any>);

      return Object.values(weeklyData)
        .map((item: any) => ({
          ...item,
          avg_candidates_found: item.searches.length > 0 
            ? item.searches.reduce((sum: number, val: number) => sum + val, 0) / item.searches.length
            : 0,
        }))
        .sort((a: any, b: any) => new Date(a.week).getTime() - new Date(b.week).getTime());
    }

    if (viewType === 'popularity') {
      // Most searched job titles
      const jobPopularity = data.reduce((acc, item) => {
        const title = item.job_title;
        if (!acc[title]) {
          acc[title] = { job_title: title, search_count: 0 };
        }
        acc[title].search_count += item.search_count;
        return acc;
      }, {} as Record<string, any>);

      return Object.values(jobPopularity)
        .sort((a: any, b: any) => b.search_count - a.search_count)
        .slice(0, 10);
    }

    if (viewType === 'effectiveness') {
      // Calculate search effectiveness (candidates found per search)
      const jobEffectiveness = data.reduce((acc, item) => {
        const title = item.job_title;
        if (!acc[title]) {
          acc[title] = { 
            job_title: title, 
            total_searches: 0, 
            total_candidates: 0,
            effectiveness: 0
          };
        }
        acc[title].total_searches += item.search_count;
        acc[title].total_candidates += item.avg_candidates_found * item.search_count;
        return acc;
      }, {} as Record<string, any>);

      return Object.values(jobEffectiveness)
        .map((item: any) => ({
          ...item,
          effectiveness: item.total_searches > 0 
            ? (item.total_candidates / item.total_searches).toFixed(1)
            : 0,
        }))
        .sort((a: any, b: any) => b.effectiveness - a.effectiveness)
        .slice(0, 10);
    }

    return [];
  };

  const chartData = processData();

  const getTitle = () => {
    switch (viewType) {
      case 'trends': return 'Search Activity Trends';
      case 'popularity': return 'Most Searched Job Titles';
      case 'effectiveness': return 'Search Effectiveness by Role';
      default: return 'Search Patterns';
    }
  };

  const getDescription = () => {
    switch (viewType) {
      case 'trends': return 'Search volume and success rate over time';
      case 'popularity': return 'Job titles with the highest search frequency';
      case 'effectiveness': return 'Average candidates found per search by job title';
      default: return 'Search pattern analytics';
    }
  };

  // Calculate insights
  const topJobTitles = data
    .reduce((acc, item) => {
      if (!acc[item.job_title]) {
        acc[item.job_title] = 0;
      }
      acc[item.job_title] += item.search_count;
      return acc;
    }, {} as Record<string, number>);

  const mostSearched = Object.entries(topJobTitles)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([title, count]) => ({ title, count }));

  const experienceLevels = data
    .reduce((acc, item) => {
      if (!acc[item.experience_level]) {
        acc[item.experience_level] = 0;
      }
      acc[item.experience_level] += item.search_count;
      return acc;
    }, {} as Record<string, number>);

  const topExperienceLevels = Object.entries(experienceLevels)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([level, count]) => ({ level, count }));

  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{getTitle()}</CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No search pattern data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{getTitle()}</CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-64">
            {viewType === 'trends' ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis 
                    dataKey="week" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="search_count"
                    stroke="var(--color-search_count)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avg_candidates_found"
                    stroke="var(--color-avg_candidates_found)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="horizontal">
                  <XAxis 
                    type="number"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    type="category"
                    dataKey="job_title"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={120}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey={viewType === 'popularity' ? 'search_count' : 'effectiveness'}
                    fill={`var(--color-${viewType === 'popularity' ? 'search_count' : 'effectiveness'})`}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Search Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Job Titles</CardTitle>
            <CardDescription>Most frequently searched positions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mostSearched.map((job, index) => (
                <div key={job.title} className="flex items-center justify-between">
                  <Badge variant={index < 2 ? "default" : "secondary"}>
                    {job.title}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {job.count} searches
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Experience Levels</CardTitle>
            <CardDescription>Search distribution by experience</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topExperienceLevels.map((exp, index) => (
                <div key={exp.level} className="flex items-center justify-between">
                  <Badge variant={index < 1 ? "default" : "secondary"}>
                    {exp.level}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {exp.count} searches
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};