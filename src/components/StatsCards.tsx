
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, TrendingUp, Clock } from 'lucide-react';

const StatsCards = () => {
  const stats = [
    {
      title: 'Total Candidates',
      value: '247',
      change: '+12%',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Resumes Processed',
      value: '1,423',
      change: '+23%',
      icon: FileText,
      color: 'text-emerald-600',
    },
    {
      title: 'Match Rate',
      value: '68%',
      change: '+5%',
      icon: TrendingUp,
      color: 'text-purple-600',
    },
    {
      title: 'Avg. Processing Time',
      value: '2.3s',
      change: '-15%',
      icon: Clock,
      color: 'text-orange-600',
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
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <p className="text-xs text-green-600 mt-1">
              {stat.change} from last month
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;
