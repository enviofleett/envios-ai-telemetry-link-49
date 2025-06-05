
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Car, 
  Activity, 
  Gauge, 
  Fuel, 
  AlertTriangle, 
  DollarSign,
  TrendingUp,
  Wifi
} from 'lucide-react';
import { FleetMetrics } from '@/hooks/useFleetAnalytics';

interface FleetMetricsCardsProps {
  metrics: FleetMetrics;
  isLoading?: boolean;
}

const FleetMetricsCards: React.FC<FleetMetricsCardsProps> = ({ metrics, isLoading }) => {
  const metricsConfig = [
    {
      title: 'Total Vehicles',
      value: metrics.totalVehicles,
      icon: Car,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
      format: (val: number) => val.toString()
    },
    {
      title: 'Active Vehicles',
      value: metrics.activeVehicles,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200',
      format: (val: number) => val.toString()
    },
    {
      title: 'Online Now',
      value: metrics.onlineVehicles,
      icon: Wifi,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 border-emerald-200',
      format: (val: number) => val.toString()
    },
    {
      title: 'Fleet Utilization',
      value: metrics.utilizationRate,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-200',
      format: (val: number) => `${val}%`
    },
    {
      title: 'Average Speed',
      value: metrics.averageSpeed,
      icon: Gauge,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 border-orange-200',
      format: (val: number) => `${val} km/h`
    },
    {
      title: 'Fuel Efficiency',
      value: metrics.fuelEfficiency,
      icon: Fuel,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50 border-cyan-200',
      format: (val: number) => `${val} km/l`
    },
    {
      title: 'Maintenance Alerts',
      value: metrics.maintenanceAlerts,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 border-red-200',
      format: (val: number) => val.toString()
    },
    {
      title: 'Cost per Mile',
      value: metrics.costPerMile,
      icon: DollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 border-yellow-200',
      format: (val: number) => `$${val}`
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {metricsConfig.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index} className={`${metric.bgColor} transition-all hover:shadow-lg`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-700">
                  {metric.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className={`text-2xl font-bold ${metric.color}`}>
                {metric.format(metric.value)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Real-time data
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default FleetMetricsCards;
