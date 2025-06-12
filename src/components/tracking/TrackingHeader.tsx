
import React from 'react';
import { MapPin, Clock, Gauge, Users, Wifi, WifiOff, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useStableVehicleData } from '@/hooks/useStableVehicleData';

const TrackingHeader: React.FC = () => {
  const { vehicles, metrics } = useStableVehicleData();

  const movingVehicles = vehicles.filter(v => v.isMoving).length;
  const idleVehicles = vehicles.filter(v => v.isOnline && !v.isMoving).length;
  const avgSpeed = vehicles
    .filter(v => v.isMoving && v.speed)
    .reduce((sum, v) => sum + (v.speed || 0), 0) / 
    Math.max(1, vehicles.filter(v => v.isMoving && v.speed).length);

  const headerMetrics = [
    {
      icon: Users,
      label: 'Total Fleet',
      value: metrics.total,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Wifi,
      label: 'Online',
      value: metrics.online,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Activity,
      label: 'Moving',
      value: movingVehicles,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      icon: Clock,
      label: 'Idle',
      value: idleVehicles,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      icon: WifiOff,
      label: 'Offline',
      value: metrics.offline,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      icon: Gauge,
      label: 'Avg Speed',
      value: `${avgSpeed.toFixed(0)} km/h`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <MapPin className="h-6 w-6 text-blue-600" />
        <div>
          <h1 className="text-xl font-bold text-slate-800">Live Fleet Tracking</h1>
          <p className="text-sm text-slate-600">Real-time vehicle monitoring and analytics</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {headerMetrics.map((metric, index) => (
          <Card key={index} className="shadow-sm border-slate-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-medium">{metric.label}</p>
                  <p className="text-lg font-bold text-slate-800">{metric.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TrackingHeader;
