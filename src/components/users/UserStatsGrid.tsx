
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Truck, Zap } from 'lucide-react';

interface UserStatsGridProps {
  totalUsers: number;
  syncedUsers: number;
  activeUsers: number;
  usersWithVehicles: number;
}

const UserStatsGrid: React.FC<UserStatsGridProps> = ({
  totalUsers,
  syncedUsers,
  activeUsers,
  usersWithVehicles
}) => {
  const stats = [
    {
      title: 'Total Users',
      value: totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active Users',
      value: activeUsers,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'GP51 Synced',
      value: syncedUsers,
      icon: Zap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'With Vehicles',
      value: usersWithVehicles,
      icon: Truck,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default UserStatsGrid;
