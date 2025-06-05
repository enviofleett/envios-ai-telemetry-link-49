
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Wrench, 
  TrendingDown, 
  Clock,
  CheckCircle,
  X
} from 'lucide-react';
import type { VehicleAnalytics } from '@/services/analytics/analyticsService';

interface RealTimeAlertsProps {
  vehicleAnalytics: VehicleAnalytics[];
}

interface Alert {
  id: string;
  type: 'maintenance' | 'performance' | 'efficiency' | 'offline';
  severity: 'high' | 'medium' | 'low';
  vehicleId: string;
  vehicleName: string;
  message: string;
  timestamp: Date;
}

const RealTimeAlerts: React.FC<RealTimeAlertsProps> = ({ vehicleAnalytics }) => {
  // Generate alerts based on vehicle analytics
  const generateAlerts = (): Alert[] => {
    const alerts: Alert[] = [];

    vehicleAnalytics.forEach(vehicle => {
      // Performance alerts
      if (vehicle.performanceRating < 60) {
        alerts.push({
          id: `perf-${vehicle.deviceId}`,
          type: 'performance',
          severity: 'high',
          vehicleId: vehicle.deviceId,
          vehicleName: vehicle.deviceName,
          message: `Low performance rating: ${vehicle.performanceRating.toFixed(1)}%`,
          timestamp: new Date()
        });
      }

      // Maintenance alerts
      if (vehicle.maintenanceScore < 70) {
        alerts.push({
          id: `maint-${vehicle.deviceId}`,
          type: 'maintenance',
          severity: vehicle.maintenanceScore < 50 ? 'high' : 'medium',
          vehicleId: vehicle.deviceId,
          vehicleName: vehicle.deviceName,
          message: `Maintenance required (Score: ${vehicle.maintenanceScore.toFixed(1)})`,
          timestamp: new Date()
        });
      }

      // Efficiency alerts
      if (vehicle.fuelEfficiency < 75) {
        alerts.push({
          id: `eff-${vehicle.deviceId}`,
          type: 'efficiency',
          severity: 'medium',
          vehicleId: vehicle.deviceId,
          vehicleName: vehicle.deviceName,
          message: `Low fuel efficiency: ${vehicle.fuelEfficiency.toFixed(1)}`,
          timestamp: new Date()
        });
      }

      // Offline alerts
      const lastActive = new Date(vehicle.lastActiveDate);
      const hoursOffline = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60);
      if (hoursOffline > 24) {
        alerts.push({
          id: `offline-${vehicle.deviceId}`,
          type: 'offline',
          severity: hoursOffline > 72 ? 'high' : 'medium',
          vehicleId: vehicle.deviceId,
          vehicleName: vehicle.deviceName,
          message: `Offline for ${Math.floor(hoursOffline)} hours`,
          timestamp: new Date()
        });
      }
    });

    return alerts.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  };

  const alerts = generateAlerts();

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'maintenance':
        return <Wrench className="h-4 w-4" />;
      case 'performance':
        return <TrendingDown className="h-4 w-4" />;
      case 'efficiency':
        return <TrendingDown className="h-4 w-4" />;
      case 'offline':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getAlertColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getSeverityBadge = (severity: Alert['severity']) => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Real-Time Alerts</span>
          <Badge variant="secondary">{alerts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">All Clear!</h3>
              <p className="text-gray-600">No active alerts for your fleet</p>
            </div>
          ) : (
            alerts.slice(0, 10).map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${getAlertColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{alert.vehicleName}</span>
                        {getSeverityBadge(alert.severity)}
                      </div>
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {alert.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {alerts.length > 10 && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              View All {alerts.length} Alerts
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RealTimeAlerts;
