
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Cog, Wifi, WifiOff, Wrench } from 'lucide-react';
import { useDeviceStats } from '@/hooks/useDeviceStats';

const DeviceStatsCards: React.FC = () => {
  const { stats, isLoading } = useDeviceStats();

  const statsData = [
    {
      title: 'Total Devices',
      value: stats?.totalDevices || 1240,
      subtitle: 'All devices',
      icon: Cog,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Online Devices',
      value: stats?.onlineDevices || 1087,
      subtitle: `${stats?.onlineRate || 87.7}% rate`,
      icon: Wifi,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Offline Devices',
      value: stats?.offlineDevices || 153,
      subtitle: `${stats?.offlineRate || 12.3}% offline`,
      icon: WifiOff,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Maintenance Due',
      value: stats?.maintenanceDue || 23,
      subtitle: 'This month',
      icon: Wrench,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsData.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">{stat.title}</span>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <IconComponent className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">{stat.subtitle}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DeviceStatsCards;
