
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Car, 
  Zap, 
  PauseCircle, 
  WifiOff, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useVehicleMetrics } from '@/hooks/useVehicleMetrics';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  badge?: {
    text: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  description?: string;
}

const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  value, 
  icon, 
  trend, 
  badge, 
  description 
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">{value}</div>
          {badge && (
            <Badge variant={badge.variant}>{badge.text}</Badge>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <TrendingUp className={`h-3 w-3 mr-1 ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`} />
            <span className={`text-xs ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const EnhancedKPICardsSection: React.FC = () => {
  const { metrics, isLoading, error } = useVehicleMetrics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="col-span-full">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-red-600">Failed to load metrics</p>
              <p className="text-sm text-gray-500 mt-1">
                {error?.message || 'Unknown error occurred'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalVehicles = metrics.totalVehicles || 0;
  const onlineVehicles = metrics.onlineVehicles || 0;
  const offlineVehicles = metrics.offlineVehicles || 0;
  const movingVehicles = metrics.movingVehicles || 0;
  const idleVehicles = metrics.idleVehicles || 0;
  const alertsCount = metrics.alerts || 0;

  // Calculate percentages safely
  const onlinePercentage = totalVehicles > 0 ? Math.round((onlineVehicles / totalVehicles) * 100) : 0;
  const movingPercentage = onlineVehicles > 0 ? Math.round((movingVehicles / onlineVehicles) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        title="Total Vehicles"
        value={totalVehicles}
        icon={<Car className="h-4 w-4 text-blue-600" />}
        description="All registered vehicles"
        badge={{
          text: "Fleet",
          variant: "secondary"
        }}
      />
      
      <KPICard
        title="Online Vehicles"
        value={onlineVehicles}
        icon={<CheckCircle className="h-4 w-4 text-green-600" />}
        description={`${onlinePercentage}% of total fleet`}
        badge={{
          text: "Connected",
          variant: onlinePercentage > 80 ? "default" : "secondary"
        }}
      />
      
      <KPICard
        title="Moving Vehicles"
        value={movingVehicles}
        icon={<Zap className="h-4 w-4 text-orange-600" />}
        description={`${movingPercentage}% of online vehicles`}
        badge={{
          text: "Active",
          variant: "default"
        }}
      />
      
      <KPICard
        title="Idle Vehicles"
        value={idleVehicles}
        icon={<PauseCircle className="h-4 w-4 text-yellow-600" />}
        description="Online but stationary"
        badge={{
          text: "Standby",
          variant: "outline"
        }}
      />
      
      <KPICard
        title="Offline Vehicles"
        value={offlineVehicles}
        icon={<WifiOff className="h-4 w-4 text-red-600" />}
        description="Not responding"
        badge={{
          text: offlineVehicles > 0 ? "Issues" : "All Good",
          variant: offlineVehicles > 0 ? "destructive" : "default"
        }}
      />
      
      <KPICard
        title="Active Alerts"
        value={alertsCount}
        icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
        description="Requires attention"
        badge={{
          text: alertsCount > 0 ? "Action Needed" : "Clear",
          variant: alertsCount > 0 ? "destructive" : "default"
        }}
      />
      
      <KPICard
        title="Avg Speed"
        value={`${Math.round(metrics.averageSpeed || 0)} km/h`}
        icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
        description="Fleet average speed"
        badge={{
          text: "Current",
          variant: "secondary"
        }}
      />
      
      <KPICard
        title="Last Sync"
        value={metrics.lastSyncTime ? new Date(metrics.lastSyncTime).toLocaleTimeString() : "Never"}
        icon={<Clock className="h-4 w-4 text-gray-600" />}
        description="Data freshness"
        badge={{
          text: metrics.syncStatus === 'success' ? "Success" : "Pending",
          variant: metrics.syncStatus === 'success' ? "default" : "secondary"
        }}
      />
    </div>
  );
};
