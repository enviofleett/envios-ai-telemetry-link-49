
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SummaryCard } from '@/components/ui/summary-card';
import { useNavigate } from 'react-router-dom';
import { 
  Car, 
  Activity, 
  MapPin, 
  Users,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Settings
} from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { metrics, alerts, isLoading } = useDashboardData();

  const quickActions = [
    {
      title: 'Fleet Management',
      description: 'Comprehensive fleet overview and analytics',
      icon: Car,
      path: '/fleet',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Live Tracking',
      description: 'Real-time vehicle location tracking',
      icon: MapPin,
      path: '/tracking',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Vehicle Management',
      description: 'Manage devices and configurations',
      icon: Settings,
      path: '/vehicles',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      title: 'User Management',
      description: 'Manage users and permissions',
      icon: Users,
      path: '/users',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Fleet Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Real-time overview of your vehicle fleet and operations
        </p>
      </div>

      {/* Fleet Metrics Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Vehicles"
          value={metrics.totalVehicles}
          icon={Car}
          description="Active fleet size"
          trend={{ value: 5, isPositive: true }}
        />
        <SummaryCard
          title="Online Vehicles"
          value={metrics.onlineVehicles}
          icon={Activity}
          description={`${metrics.totalVehicles > 0 ? ((metrics.onlineVehicles / metrics.totalVehicles) * 100).toFixed(1) : 0}% of fleet`}
          trend={{ value: 8, isPositive: true }}
        />
        <SummaryCard
          title="Active Vehicles"
          value={metrics.activeVehicles}
          icon={TrendingUp}
          description="Currently in operation"
          trend={{ value: 12, isPositive: true }}
        />
        <SummaryCard
          title="Alert Vehicles"
          value={metrics.alertVehicles}
          icon={AlertTriangle}
          description="Require attention"
          trend={{ value: 3, isPositive: false }}
        />
      </div>

      {/* Fleet Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Fleet Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/10">
              <div className="text-2xl font-bold text-primary">
                {metrics.totalVehicles > 0 ? ((metrics.onlineVehicles / metrics.totalVehicles) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Fleet Utilization</div>
              <div className="text-xs text-muted-foreground mt-1">Currently active</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">98.5%</div>
              <div className="text-sm text-muted-foreground">System Health</div>
              <div className="text-xs text-muted-foreground mt-1">All systems operational</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">24/7</div>
              <div className="text-sm text-muted-foreground">Monitoring</div>
              <div className="text-xs text-muted-foreground mt-1">Real-time tracking</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card 
                key={action.path}
                className={`${action.bgColor} ${action.borderColor} border-2 hover:shadow-lg transition-all duration-200 cursor-pointer group`}
                onClick={() => navigate(action.path)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${action.color}`} />
                    {action.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full group-hover:bg-background/80 transition-colors"
                  >
                    Open <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Recent Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts && alerts.length > 0 ? (
              alerts.slice(0, 3).map((alert) => (
                <div 
                  key={alert.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <div>
                      <p className="font-medium text-sm">{alert.alarmType}</p>
                      <p className="text-xs text-muted-foreground">
                        {alert.deviceName} • {alert.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      alert.severity === 'critical' ? 'bg-destructive/10 text-destructive' :
                      alert.severity === 'high' ? 'bg-warning/10 text-warning' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {alert.severity}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="font-medium">No active alerts</p>
                <p className="text-sm">All systems operational</p>
              </div>
            )}
          </div>
          {alerts && alerts.length > 3 && (
            <div className="mt-4 pt-4 border-t border-border">
              <Button variant="outline" size="sm" className="w-full">
                View All Alerts
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
