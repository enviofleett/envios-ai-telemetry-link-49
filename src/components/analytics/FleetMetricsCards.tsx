
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  Activity, 
  Gauge, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Wrench
} from 'lucide-react';
import type { FleetMetrics } from '@/services/analytics/analyticsService';

interface FleetMetricsCardsProps {
  metrics: FleetMetrics;
  isLoading: boolean;
}

const FleetMetricsCards: React.FC<FleetMetricsCardsProps> = ({ metrics, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const onlinePercentage = metrics.totalVehicles > 0 
    ? ((metrics.onlineVehicles / metrics.totalVehicles) * 100).toFixed(1) 
    : '0';

  const utilizationPercentage = (metrics.averageUtilization * 100).toFixed(1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Fleet</CardTitle>
          <Car className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalVehicles}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.activeVehicles} active vehicles
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Online Status</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{metrics.onlineVehicles}</div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {onlinePercentage}%
            </Badge>
            <span className="text-xs text-muted-foreground">online now</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Fleet Utilization</CardTitle>
          <Gauge className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{utilizationPercentage}%</div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span className="text-xs text-green-600">+2.1% from last month</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Fuel Efficiency</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.fuelEfficiencyScore.toFixed(1)}</div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span className="text-xs text-green-600">Efficiency score</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
          <Badge variant={metrics.performanceScore >= 80 ? "default" : "secondary"}>
            {metrics.performanceScore >= 80 ? "Good" : "Needs Attention"}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.performanceScore}%</div>
          <p className="text-xs text-muted-foreground">
            Overall fleet performance
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Maintenance Alerts</CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{metrics.maintenanceAlerts}</div>
          <p className="text-xs text-muted-foreground">
            Vehicles needing attention
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cost per KM</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${metrics.costPerKm.toFixed(2)}</div>
          <div className="flex items-center gap-1">
            <TrendingDown className="h-3 w-3 text-green-500" />
            <span className="text-xs text-green-600">-3.2% vs last month</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">System Health</CardTitle>
          <Wrench className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">98.5%</div>
          <div className="flex items-center gap-1">
            <Badge variant="default" className="text-xs">Healthy</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FleetMetricsCards;
