
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Wifi, 
  WifiOff, 
  Clock
} from 'lucide-react';
import type { VehicleMetrics } from '@/services/unifiedVehicleData';
import type { SyncMetrics } from '@/services/vehiclePosition/types';
import type { Vehicle } from '@/services/unifiedVehicleData';

interface LiveTrackingStatsProps {
  metrics: VehicleMetrics;
  syncMetrics: SyncMetrics;
  vehiclesByStatus: {
    online: Vehicle[];
    offline: Vehicle[];
    alerts: Vehicle[];
  };
}

const LiveTrackingStats: React.FC<LiveTrackingStatsProps> = ({
  metrics,
  syncMetrics,
  vehiclesByStatus
}) => {
  // Calculate unactivated vehicles (vehicles that have never been online)
  const unactivatedCount = Math.max(0, metrics.total - metrics.online - metrics.offline);

  const cards = [
    {
      title: "Online",
      value: metrics.online,
      icon: Wifi,
      iconColor: "#22c55e"
    },
    {
      title: "Offline",
      value: metrics.offline,
      icon: WifiOff,
      iconColor: "#ef4444"
    },
    {
      title: "Unactivated",
      value: unactivatedCount,
      icon: Clock,
      iconColor: "#f59e0b"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <Card key={index} className="h-[120px] bg-white border border-gray-lighter shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-mid">{card.title}</span>
                <IconComponent className="w-4 h-4" style={{ color: card.iconColor }} />
              </div>
              <div className="text-2xl font-bold text-primary-dark mb-1">
                {card.value}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default LiveTrackingStats;
