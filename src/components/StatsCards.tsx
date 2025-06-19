
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, TrendingUp, Clock } from 'lucide-react';
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
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Job Postings',
      value: jobPostings.filter(j => j.status === 'active').length.toString(),
      description: 'Currently open positions',
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Average AI Score',
      value: `${averageScore}%`,
      description: 'Average candidate match score',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'This Week',
      value: recentCandidates.toString(),
      description: 'New candidates this week',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stat.value}
            </div>
            <p className="text-sm text-gray-500">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;
