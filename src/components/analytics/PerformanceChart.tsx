import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface PerformanceData {
  month: string;
  source: string;
  total_candidates: number;
  shortlisted: number;
  hired: number;
  avg_ai_score: number;
  batches_processed: number;
}

interface PerformanceChartProps {
  data: PerformanceData[];
  type: 'line' | 'bar';
  metric: 'candidates' | 'conversion' | 'score';
}

const chartConfig = {
  total_candidates: {
    label: "Total Candidates",
    color: "hsl(var(--primary))",
  },
  shortlisted: {
    label: "Shortlisted",
    color: "hsl(var(--secondary))",
  },
  hired: {
    label: "Hired",
    color: "hsl(var(--accent))",
  },
  avg_ai_score: {
    label: "Average AI Score",
    color: "hsl(var(--muted-foreground))",
  },
  upload: {
    label: "Upload",
    color: "hsl(var(--primary))",
  },
  linkedin_search: {
    label: "LinkedIn",
    color: "hsl(var(--secondary))",
  },
  hh_search: {
    label: "HH.ru",
    color: "hsl(var(--accent))",
  },
};

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  type,
  metric,
}) => {
  const formatMonth = (month: string) => {
    return new Date(month).toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const processData = () => {
    if (metric === 'candidates') {
      // Group by month and aggregate candidates by source
      const monthlyData = data.reduce((acc, item) => {
        const month = formatMonth(item.month);
        if (!acc[month]) {
          acc[month] = { month, upload: 0, linkedin_search: 0, hh_search: 0 };
        }
        acc[month][item.source as keyof typeof acc[typeof month]] += item.total_candidates;
        return acc;
      }, {} as Record<string, any>);
      
      return Object.values(monthlyData);
    }

    if (metric === 'conversion') {
      const monthlyData = data.reduce((acc, item) => {
        const month = formatMonth(item.month);
        if (!acc[month]) {
          acc[month] = { 
            month, 
            total_candidates: 0, 
            shortlisted: 0, 
            hired: 0,
            conversion_rate: 0 
          };
        }
        acc[month].total_candidates += item.total_candidates;
        acc[month].shortlisted += item.shortlisted;
        acc[month].hired += item.hired;
        return acc;
      }, {} as Record<string, any>);

      return Object.values(monthlyData).map((item: any) => ({
        ...item,
        conversion_rate: item.total_candidates > 0 
          ? ((item.shortlisted / item.total_candidates) * 100).toFixed(1)
          : 0,
      }));
    }

    if (metric === 'score') {
      const monthlyData = data.reduce((acc, item) => {
        const month = formatMonth(item.month);
        if (!acc[month]) {
          acc[month] = { month, scores: [], avg_ai_score: 0 };
        }
        if (item.avg_ai_score) {
          acc[month].scores.push(item.avg_ai_score);
        }
        return acc;
      }, {} as Record<string, any>);

      return Object.values(monthlyData).map((item: any) => ({
        ...item,
        avg_ai_score: item.scores.length > 0 
          ? (item.scores.reduce((sum: number, score: number) => sum + score, 0) / item.scores.length).toFixed(1)
          : 0,
      }));
    }

    return [];
  };

  const chartData = processData();

  const getTitle = () => {
    switch (metric) {
      case 'candidates': return 'Candidate Volume by Source';
      case 'conversion': return 'Conversion Funnel';
      case 'score': return 'AI Score Trends';
      default: return 'Performance Metrics';
    }
  };

  const getDescription = () => {
    switch (metric) {
      case 'candidates': return 'Number of candidates sourced by channel over time';
      case 'conversion': return 'Conversion rates from candidates to shortlisted/hired';
      case 'score': return 'Average AI matching scores over time';
      default: return 'Performance analytics';
    }
  };

  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{getTitle()}</CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No data available for the selected period
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{getTitle()}</CardTitle>
        <CardDescription>{getDescription()}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64">
          {type === 'line' ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis 
                  dataKey="month" 
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
                {metric === 'candidates' && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="upload"
                      stroke="var(--color-upload)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="linkedin_search"
                      stroke="var(--color-linkedin_search)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="hh_search"
                      stroke="var(--color-hh_search)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </>
                )}
                {metric === 'score' && (
                  <Line
                    type="monotone"
                    dataKey="avg_ai_score"
                    stroke="var(--color-avg_ai_score)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                )}
                {metric === 'conversion' && (
                  <Line
                    type="monotone"
                    dataKey="conversion_rate"
                    stroke="var(--color-total_candidates)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis 
                  dataKey="month" 
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
                {metric === 'candidates' && (
                  <>
                    <Bar
                      dataKey="upload"
                      fill="var(--color-upload)"
                      radius={[0, 0, 4, 4]}
                    />
                    <Bar
                      dataKey="linkedin_search"
                      fill="var(--color-linkedin_search)"
                      radius={[0, 0, 4, 4]}
                    />
                    <Bar
                      dataKey="hh_search"
                      fill="var(--color-hh_search)"
                      radius={[0, 0, 4, 4]}
                    />
                  </>
                )}
                {metric === 'conversion' && (
                  <>
                    <Bar
                      dataKey="total_candidates"
                      fill="var(--color-total_candidates)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="shortlisted"
                      fill="var(--color-shortlisted)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="hired"
                      fill="var(--color-hired)"
                      radius={[4, 4, 0, 0]}
                    />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
};