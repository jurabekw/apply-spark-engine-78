
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, TrendingUp, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import { useCandidates } from '@/hooks/useCandidates';
import { useJobPostings } from '@/hooks/useJobPostings';

const StatsCards = () => {
  const { candidates } = useCandidates();
  const { jobPostings } = useJobPostings();

  const totalCandidates = candidates.length;
  const shortlistedCandidates = candidates.filter(c => c.status === 'shortlisted').length;
  const averageScore = candidates.length > 0 
    ? Math.round(candidates.reduce((sum, c) => sum + (c.ai_score || 0), 0) / candidates.length)
    : 0;
  const recentCandidates = candidates.filter(c => {
    const daysSince = (Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 7;
  }).length;

  const stats = [
    {
      title: 'Total Candidates',
      value: totalCandidates.toString(),
      description: 'All candidates in database',
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      change: '+12%',
      trend: 'up' as const,
    },
    {
      title: 'Active Positions',
      value: jobPostings.filter(j => j.status === 'active').length.toString(),
      description: 'Currently open positions',
      icon: FileText,
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-50 to-emerald-100',
      change: '+3',
      trend: 'up' as const,
    },
    {
      title: 'Average AI Score',
      value: `${averageScore}%`,
      description: 'Candidate match quality',
      icon: TrendingUp,
      gradient: 'from-primary to-accent',
      bgGradient: 'from-primary/10 to-accent/10',
      change: '+5%',
      trend: 'up' as const,
    },
    {
      title: 'This Week',
      value: recentCandidates.toString(),
      description: 'New candidates added',
      icon: Clock,
      gradient: 'from-amber-500 to-orange-500',
      bgGradient: 'from-amber-50 to-orange-100',
      change: recentCandidates > 5 ? '+↗' : '+2',
      trend: recentCandidates > 5 ? 'up' : 'steady' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card 
          key={index} 
          className="group cursor-pointer border-border/50 bg-gradient-to-br from-card to-card/50 hover-lift animate-fade-in"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-heading font-bold text-foreground">
                  {stat.value}
                </span>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  stat.trend === 'up' 
                    ? 'bg-success/10 text-success' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {stat.trend === 'up' && <ArrowUp className="w-3 h-3" />}
                  {stat.change}
                </div>
              </div>
            </div>
            <div className={`relative p-3 rounded-xl bg-gradient-to-br ${stat.bgGradient} group-hover:scale-110 transition-transform duration-200`}>
              <div className={`relative z-10 w-6 h-6 bg-gradient-to-br ${stat.gradient} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-4 h-4 text-white" />
              </div>
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-xl group-hover:opacity-20 transition-opacity`}></div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-sm text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;
