
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, MapPin, AlertTriangle, Clock } from 'lucide-react';
import { unifiedVehicleDataService } from '@/services/unifiedVehicleData';
import type { VehicleDataMetrics } from '@/services/unifiedVehicleData'; // Fixed import

interface LiveTrackingStatsProps {
  metrics: VehicleDataMetrics;
}

export function LiveTrackingStats({ metrics }: LiveTrackingStatsProps) {
  const cards = [
    {
      title: 'Total Vehicles',
      value: metrics.total,
      icon: Activity,
      color: 'bg-blue-500',
      change: '+2 from yesterday'
    },
    {
      title: 'Online Now',
      value: metrics.online,
      icon: MapPin,
      color: 'bg-green-500',
      change: `${Math.round((metrics.online / metrics.total) * 100)}% online rate`
    },
    {
      title: 'Active Alerts',
      value: metrics.alerts,
      icon: AlertTriangle,
      color: 'bg-red-500',
      change: 'Requires attention'
    },
    {
      title: 'Last Update',
      value: new Date(metrics.lastSyncTime).toLocaleTimeString(),
      icon: Clock,
      color: 'bg-purple-500',
      change: 'Real-time sync'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.color}`}>
                <IconComponent className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.change}
              </p>
              {card.title === 'Online Now' && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    {metrics.offline} offline
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
