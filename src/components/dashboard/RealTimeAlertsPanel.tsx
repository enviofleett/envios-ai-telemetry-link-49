
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  AlertTriangle, 
  MapPin, 
  Clock, 
  Eye,
  X,
  Calendar,
  Navigation
} from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';

interface Alert {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  vehicle?: string;
  location?: string;
  timestamp: Date;
  actionLabel: string;
}

const RealTimeAlertsPanel: React.FC = () => {
  const { alerts: backendAlerts, isLoading } = useDashboardData();
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    if (backendAlerts && backendAlerts.length > 0) {
      const transformedAlerts: Alert[] = backendAlerts.map((alert) => ({
        id: alert.id,
        priority: alert.severity === 'critical' ? 'high' : 
                 alert.severity === 'high' ? 'high' :
                 alert.severity === 'medium' ? 'medium' : 'low',
        title: `${alert.alertType} - ${alert.deviceName}`,
        description: alert.description,
        vehicle: alert.deviceId,
        timestamp: new Date(alert.timestamp),
        actionLabel: alert.severity === 'critical' ? 'Urgent' : 'View'
      }));
      setAlerts(transformedAlerts);
    }
  }, [backendAlerts]);

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: '🔴',
          badgeClass: 'bg-red-500'
        };
      case 'medium':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: '🟡',
          badgeClass: 'bg-yellow-500'
        };
      case 'low':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: '🔵',
          badgeClass: 'bg-blue-500'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '⚪',
          badgeClass: 'bg-gray-500'
        };
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const handleDismissAlert = (alertId: string) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };

  const alertCount = alerts.length;

  if (isLoading) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm h-fit">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            Real-time Alerts
            <Bell className="h-5 w-5" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-sm h-fit">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            Real-time Alerts
            <Bell className="h-5 w-5" />
          </CardTitle>
          {alertCount > 0 && (
            <Badge variant="destructive" className="bg-red-500 text-white">
              {alertCount}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Alerts List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {alerts.map((alert) => {
            const config = getPriorityConfig(alert.priority);
            
            return (
              <div 
                key={alert.id}
                className={`p-3 rounded-lg border ${config.color} hover:shadow-sm transition-shadow`}
              >
                {/* Alert Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {config.icon} {alert.priority.toUpperCase()}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-white/50"
                    onClick={() => handleDismissAlert(alert.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                {/* Alert Content */}
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    {alert.title}
                  </h4>
                  <p className="text-xs text-gray-600">
                    {alert.description}
                  </p>
                </div>

                {/* Alert Footer */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {formatTimeAgo(alert.timestamp)}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-6 px-2"
                  >
                    {alert.actionLabel}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {alerts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No active alerts</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 border-t border-gray-200 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 text-xs">
            View All Alerts
          </Button>
          <Button variant="outline" size="sm" className="flex-1 text-xs">
            Mark All Read
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RealTimeAlertsPanel;
