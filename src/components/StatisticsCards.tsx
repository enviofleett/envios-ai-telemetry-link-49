
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Car, MapPin, Activity, AlertTriangle } from 'lucide-react';
import type { GP51DashboardSummary } from '@/types/gp51';

interface StatisticsCardsProps {
  summary?: GP51DashboardSummary;
}

const StatisticsCards: React.FC<StatisticsCardsProps> = ({ summary }) => {
  // Safe property access with fallbacks
  const getSafeValue = (primary: number | undefined, fallback: number | undefined, defaultValue: number = 0): number => {
    return primary ?? fallback ?? defaultValue;
  };

  const cards = [
    {
      title: 'Total Devices',
      value: getSafeValue(summary?.total_devices, summary?.totalDevices),
      icon: Car,
      description: 'All registered devices'
    },
    {
      title: 'Active Devices',
      value: getSafeValue(summary?.active_devices, summary?.activeDevices),
      icon: Activity,
      description: 'Currently active devices'
    },
    {
      title: 'Device Groups',
      value: getSafeValue(summary?.total_groups, summary?.totalGroups),
      icon: MapPin,
      description: 'Organized device groups'
    },
    {
      title: 'Total Users',
      value: getSafeValue(summary?.total_users, summary?.totalUsers),
      icon: Users,
      description: 'System users'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StatisticsCards;
