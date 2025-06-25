
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Car, MapPin, Activity, AlertTriangle } from 'lucide-react';
import type { GPS51DashboardSummary } from '@/types/gp51';

interface StatisticsCardsProps {
  summary?: GPS51DashboardSummary;
}

const StatisticsCards: React.FC<StatisticsCardsProps> = ({ summary }) => {
  const cards = [
    {
      title: 'Total Devices',
      value: summary?.total_devices || 0,
      icon: Car,
      description: 'All registered devices'
    },
    {
      title: 'Active Devices',
      value: summary?.active_devices || 0,
      icon: Activity,
      description: 'Currently active devices'
    },
    {
      title: 'Device Groups',
      value: summary?.total_groups || 0,
      icon: MapPin,
      description: 'Organized device groups'
    },
    {
      title: 'Total Users',
      value: summary?.total_users || 0,
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
