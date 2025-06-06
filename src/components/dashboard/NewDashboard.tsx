
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  Activity, 
  AlertTriangle, 
  MapPin, 
  TrendingUp,
  Users,
  Settings,
  RefreshCw,
  ArrowUpRight,
  Eye
} from 'lucide-react';
import { useUnifiedVehicleData } from '@/hooks/useUnifiedVehicleData';

const NewDashboard: React.FC = () => {
  const { 
    vehicles, 
    metrics, 
    syncMetrics, 
    isLoading, 
    isRefreshing, 
    forceRefresh 
  } = useUnifiedVehicleData();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const metricCards = [
    {
      title: "Total Fleet",
      value: metrics.total,
      subtitle: "Active vehicles",
      icon: Car,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Online Now",
      value: metrics.online,
      subtitle: `${metrics.total > 0 ? ((metrics.online / metrics.total) * 100).toFixed(1) : 0}% active`,
      icon: Activity,
      color: "text-success-primary",
      bgColor: "bg-success-primary/10"
    },
    {
      title: "Alerts",
      value: metrics.alerts,
      subtitle: "Need attention",
      icon: AlertTriangle,
      color: "text-warning-primary",
      bgColor: "bg-warning-primary/10"
    },
    {
      title: "Last Sync",
      value: syncMetrics.positionsUpdated,
      subtitle: syncMetrics.lastSyncTime.toLocaleTimeString(),
      icon: RefreshCw,
      color: "text-teal-primary",
      bgColor: "bg-teal-primary/10"
    }
  ];

  const quickActions = [
    {
      title: "Fleet Overview",
      description: "Manage your fleet operations and analytics",
      icon: Car,
      color: "text-primary",
      href: "/fleet"
    },
    {
      title: "Live Tracking",
      description: "Real-time vehicle location tracking",
      icon: MapPin,
      color: "text-teal-primary",
      href: "/tracking"
    },
    {
      title: "Vehicle Management",
      description: "Manage individual vehicle settings",
      icon: Activity,
      color: "text-success-primary",
      href: "/vehicles"
    },
    {
      title: "User Management",
      description: "Manage system users and permissions",
      icon: Users,
      color: "text-warning-primary",
      href: "/users"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Fleet Command Center</h1>
          <p className="text-lg text-muted-foreground">
            Unified view of all {metrics.total} vehicles with real-time insights
          </p>
        </div>
        <Button
          onClick={forceRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 bg-teal-primary hover:bg-teal-secondary"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Syncing...' : 'Refresh Data'}
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <Card key={index} className="card-shadow hover:card-shadow-lg transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <IconComponent className={`h-5 w-5 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground mb-1">
                  {metric.value}
                </div>
                <p className="text-sm text-muted-foreground">
                  {metric.subtitle}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Performance Insights */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="h-6 w-6 text-teal-primary" />
            Fleet Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-success-primary/5 rounded-xl border border-success-primary/20">
              <div className="text-3xl font-bold text-success-primary mb-2">
                {metrics.total > 0 ? ((metrics.online / metrics.total) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-sm text-muted-foreground font-medium">Fleet Utilization</div>
            </div>
            <div className="text-center p-6 bg-teal-primary/5 rounded-xl border border-teal-primary/20">
              <div className="text-3xl font-bold text-teal-primary mb-2">
                {vehicles.filter(v => v.lastPosition?.speed && v.lastPosition.speed > 0).length}
              </div>
              <div className="text-sm text-muted-foreground font-medium">Vehicles Moving</div>
            </div>
            <div className="text-center p-6 bg-warning-primary/5 rounded-xl border border-warning-primary/20">
              <div className="text-3xl font-bold text-warning-primary mb-2">
                {syncMetrics.errors > 0 ? syncMetrics.errors : 0}
              </div>
              <div className="text-sm text-muted-foreground font-medium">Sync Issues</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <Card key={index} className="card-shadow hover:card-shadow-lg transition-all duration-200 group cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg bg-gray-very-light`}>
                    <IconComponent className={`h-6 w-6 ${action.color}`} />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <CardTitle className="text-lg font-semibold">
                  {action.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {action.description}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full group-hover:bg-muted transition-colors"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Activity className="h-6 w-6 text-teal-primary" />
            Recent Vehicle Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {vehicles.slice(0, 8).map((vehicle) => {
              const isOnline = vehicle.lastPosition?.updatetime && 
                (new Date().getTime() - new Date(vehicle.lastPosition.updatetime).getTime()) <= 5 * 60 * 1000;
              
              return (
                <div 
                  key={vehicle.deviceid}
                  className="flex items-center justify-between p-4 hover:bg-muted rounded-lg border border-border transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-success-primary' : 'bg-muted'}`}></div>
                    <div>
                      <div className="font-medium text-foreground">{vehicle.devicename}</div>
                      <div className="text-sm text-muted-foreground">
                        Speed: {vehicle.lastPosition?.speed || 0} km/h
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={isOnline ? "default" : "secondary"} className="mb-2">
                      {isOnline ? "Online" : "Offline"}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {vehicle.lastPosition?.updatetime 
                        ? new Date(vehicle.lastPosition.updatetime).toLocaleTimeString()
                        : 'No data'
                      }
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewDashboard;
