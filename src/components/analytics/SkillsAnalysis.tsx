import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';

interface SkillData {
  skill: string;
  frequency: number;
  avg_score: number;
  source: string;
}

interface SkillsAnalysisProps {
  data: SkillData[];
  viewType: 'frequency' | 'score' | 'distribution';
}

const chartConfig = {
  frequency: {
    label: "Frequency",
    color: "hsl(var(--primary))",
  },
  avg_score: {
    label: "Average Score",
    color: "hsl(var(--secondary))",
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

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--muted))',
  'hsl(var(--destructive))',
];

export const SkillsAnalysis: React.FC<SkillsAnalysisProps> = ({
  data,
  viewType,
}) => {
  const processData = () => {
    if (viewType === 'frequency') {
      const skillFrequency = data.reduce((acc, item) => {
        const skill = item.skill;
        if (!acc[skill]) {
          acc[skill] = { skill, frequency: 0 };
        }
        acc[skill].frequency += item.frequency;
        return acc;
      }, {} as Record<string, any>);

      return Object.values(skillFrequency)
        .sort((a: any, b: any) => b.frequency - a.frequency)
        .slice(0, 15);
    }

    if (viewType === 'score') {
      const skillScores = data.reduce((acc, item) => {
        const skill = item.skill;
        if (!acc[skill]) {
          acc[skill] = { skill, scores: [], avg_score: 0 };
        }
        acc[skill].scores.push(item.avg_score);
        return acc;
      }, {} as Record<string, any>);

      return Object.values(skillScores)
        .map((item: any) => ({
          skill: item.skill,
          avg_score: item.scores.reduce((sum: number, score: number) => sum + score, 0) / item.scores.length,
        }))
        .sort((a: any, b: any) => b.avg_score - a.avg_score)
        .slice(0, 10);
    }

    if (viewType === 'distribution') {
      const sourceDistribution = data.reduce((acc, item) => {
        const source = item.source;
        if (!acc[source]) {
          acc[source] = { source, value: 0 };
        }
        acc[source].value += item.frequency;
        return acc;
      }, {} as Record<string, any>);

      return Object.values(sourceDistribution);
    }

    return [];
  };

  const chartData = processData();

  const getTitle = () => {
    switch (viewType) {
      case 'frequency': return 'Most In-Demand Skills';
      case 'score': return 'Highest Scoring Skills';
      case 'distribution': return 'Skills by Source';
      default: return 'Skills Analysis';
    }
  };

  const getDescription = () => {
    switch (viewType) {
      case 'frequency': return 'Skills that appear most frequently in candidate profiles';
      case 'score': return 'Skills with the highest average AI matching scores';
      case 'distribution': return 'Distribution of skills across different sources';
      default: return 'Detailed skills analytics';
    }
  };

  const topSkills = data
    .reduce((acc, item) => {
      const skill = item.skill;
      if (!acc[skill]) {
        acc[skill] = { skill, frequency: 0 };
      }
      acc[skill].frequency += item.frequency;
      return acc;
    }, {} as Record<string, any>);

  const topSkillsList = Object.values(topSkills)
    .sort((a: any, b: any) => b.frequency - a.frequency)
    .slice(0, 8) as Array<{ skill: string; frequency: number }>;

  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{getTitle()}</CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No skills data available
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
            {viewType === 'distribution' ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ source, percent }) => `${source} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
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
                    dataKey="skill"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey={viewType === 'frequency' ? 'frequency' : 'avg_score'}
                    fill={`var(--color-${viewType === 'frequency' ? 'frequency' : 'avg_score'})`}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Top Skills Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Top Skills Overview</CardTitle>
          <CardDescription>Quick overview of the most frequently mentioned skills</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {topSkillsList.map((skill, index) => (
              <Badge 
                key={skill.skill}
                variant={index < 3 ? "default" : "secondary"}
                className="text-sm"
              >
                {skill.skill} ({skill.frequency})
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};