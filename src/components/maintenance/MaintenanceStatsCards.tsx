import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';
import { useMaintenanceStats } from '@/hooks/maintenance/useMaintenanceStats';
import LoadingSpinner from '@/components/LoadingSpinner';

const MaintenanceStatsCards: React.FC = () => {
  const { getMaintenanceStats } = useMaintenanceStats();
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    pendingMaintenance: 0,
    completedThisMonth: 0,
    totalSpent: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getMaintenanceStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch maintenance stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [getMaintenanceStats]);

  const statsCards = [
    {
      title: 'Upcoming Appointments',
      value: stats.upcomingAppointments,
      description: 'Scheduled maintenance appointments',
      icon: Calendar,
      color: 'text-blue-600'
    },
    {
      title: 'Pending Maintenance',
      value: stats.pendingMaintenance,
      description: 'Items requiring attention',
      icon: AlertTriangle,
      color: 'text-yellow-600'
    },
    {
      title: 'Completed This Month',
      value: stats.completedThisMonth,
      description: 'Maintenance tasks completed',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Total Spent',
      value: `$${stats.totalSpent.toFixed(2)}`,
      description: 'Monthly maintenance costs',
      icon: DollarSign,
      color: 'text-purple-600'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex justify-center">
                <LoadingSpinner />
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
