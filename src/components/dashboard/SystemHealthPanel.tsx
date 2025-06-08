
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wifi, 
  Database, 
  MessageSquare, 
  Mail,
  RefreshCw,
  Activity,
  AlertCircle,
  CheckCircle,
  Play,
  FileText,
  BarChart3
} from 'lucide-react';
import { useSystemHealth } from '@/hooks/useSystemHealth';

const SystemHealthPanel: React.FC = () => {
  const { healthStatus, isLoading } = useSystemHealth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircle;
      case 'warning': return AlertCircle;
      case 'critical': return AlertCircle;
      default: return AlertCircle;
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900">System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const serviceStatus = [
    {
      name: 'GP51 Platform',
      status: healthStatus?.metrics.find(m => m.name === 'gp51_connection')?.status || 'critical',
      uptime: '99.9%',
      metric: healthStatus?.metrics.find(m => m.name === 'gp51_connection')?.message || 'Checking...',
      icon: Wifi,
      color: 'green'
    },
    {
      name: 'Database',
      status: healthStatus?.metrics.find(m => m.name === 'database')?.status || 'critical',
      uptime: '99.8%',
      metric: healthStatus?.metrics.find(m => m.name === 'database')?.message || 'Checking...',
      icon: Database,
      color: 'green'
    },
    {
      name: 'Sync Service',
      status: healthStatus?.metrics.find(m => m.name === 'sync_service')?.status || 'warning',
      uptime: '95%',
      metric: healthStatus?.metrics.find(m => m.name === 'sync_service')?.message || 'Checking...',
      icon: RefreshCw,
      color: 'yellow'
    },
    {
      name: 'Vehicle Data',
      status: healthStatus?.metrics.find(m => m.name === 'vehicle_data_integrity')?.status || 'warning',
      uptime: '87%',
      metric: healthStatus?.metrics.find(m => m.name === 'vehicle_data_integrity')?.message || 'Checking...',
      icon: Activity,
      color: 'yellow'
    }
  ];

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            System Health
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <RefreshCw className="h-4 w-4" />
            <span>Last updated: {healthStatus?.metrics[0]?.lastChecked ? 
              new Date(healthStatus.metrics[0].lastChecked).toLocaleTimeString() : 'Never'}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Service Status Grid */}
        <div className="grid grid-cols-2 gap-4">
          {serviceStatus.map((service) => {
            const StatusIcon = getStatusIcon(service.status);
            const IconComponent = service.icon;
            
            return (
              <div 
                key={service.name}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-sm text-gray-900">{service.name}</span>
                  </div>
                  <StatusIcon 
                    className={`h-4 w-4 ${
                      service.status === 'healthy' ? 'text-green-600' :
                      service.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                    }`}
                  />
                </div>
                
                <div className="space-y-1">
                  <Badge 
                    variant="secondary" 
                    className={`${getStatusColor(service.status)} text-xs`}
                  >
                    {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                  </Badge>
                  <div className="text-xs text-gray-500">
                    {service.uptime} uptime
                  </div>
                  <div className="text-xs text-gray-600 font-medium">
                    {service.metric}
                  </div>
                </div>
                
                {service.status === 'critical' && (
                  <Button size="sm" variant="outline" className="w-full mt-2 text-xs">
                    Fix Now
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* System Overview */}
        <div className="pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="font-medium text-gray-900">Overall Status</div>
              <Badge 
                variant="secondary" 
                className={`${getStatusColor(healthStatus?.overall || 'critical')} mt-1`}
              >
                {healthStatus?.overall?.charAt(0).toUpperCase() + healthStatus?.overall?.slice(1) || 'Unknown'}
              </Badge>
            </div>
            <div>
              <div className="font-medium text-gray-900">Response Time</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {healthStatus?.responseTime || 0}ms
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-900">Uptime</div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                {healthStatus?.uptime ? Math.floor(healthStatus.uptime / 1000 / 60) : 0}m
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              <Play className="h-3 w-3 mr-1" />
              Restart Services
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              Run Diagnostics
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              View Logs
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <BarChart3 className="h-3 w-3 mr-1" />
              System Report
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemHealthPanel;
