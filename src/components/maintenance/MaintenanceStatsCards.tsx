
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, CheckCircle, DollarSign } from 'lucide-react';
import useMaintenance from '@/hooks/useMaintenance';

interface MaintenanceStats {
  upcomingAppointments: number;
  pendingMaintenance: number;
  completedThisMonth: number;
  totalSpent: number;
}

const MaintenanceStatsCards: React.FC = () => {
  const { getMaintenanceStats } = useMaintenance();
  const [stats, setStats] = useState<MaintenanceStats>({
    upcomingAppointments: 0,
    pendingMaintenance: 0,
    completedThisMonth: 0,
    totalSpent: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      const statsData = await getMaintenanceStats();
      setStats(statsData);
      setLoading(false);
    };

    loadStats();
  }, []);

  const statsCards = [
    {
      title: 'Upcoming Appointments',
      value: stats.upcomingAppointments.toString(),
      icon: Calendar,
      color: 'text-blue-600',
      description: 'Scheduled maintenance visits'
    },
    {
      title: 'Pending Maintenance',
      value: stats.pendingMaintenance.toString(),
      icon: Clock,
      color: 'text-orange-600',
      description: 'Overdue or upcoming service'
    },
    {
      title: 'Completed This Month',
      value: stats.completedThisMonth.toString(),
      icon: CheckCircle,
      color: 'text-green-600',
      description: 'Services completed in current month'
    },
    {
      title: 'Total Spent',
      value: `$${stats.totalSpent.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-purple-600',
      description: 'Maintenance costs this month'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <CardDescription className="text-xs text-muted-foreground">
              {stat.description}
            </CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MaintenanceStatsCards;
