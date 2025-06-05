
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Clock, MapPin, Bell, X } from 'lucide-react';

interface Alert {
  id: string;
  vehicleId: string;
  vehicleName: string;
  type: 'maintenance' | 'security' | 'performance' | 'geofence' | 'fuel';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  location?: string;
  resolved: boolean;
}

interface RealTimeAlertsProps {
  vehicleAnalytics: any[];
}

const RealTimeAlerts: React.FC<RealTimeAlertsProps> = ({ vehicleAnalytics }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showResolved, setShowResolved] = useState(false);

  // Generate sample alerts based on vehicle data
  useEffect(() => {
    const generateAlerts = () => {
      const alertTypes = ['maintenance', 'security', 'performance', 'geofence', 'fuel'] as const;
      const severities = ['low', 'medium', 'high', 'critical'] as const;
      const messages = {
        maintenance: 'Scheduled maintenance due in 3 days',
        security: 'Unusual activity detected after hours',
        performance: 'Fuel efficiency below optimal range',
        geofence: 'Vehicle left designated area',
        fuel: 'Low fuel level detected'
      };

      const newAlerts: Alert[] = vehicleAnalytics
        .filter(vehicle => vehicle.alerts > 0)
        .map((vehicle, index) => ({
          id: `alert-${vehicle.deviceId}-${index}`,
          vehicleId: vehicle.deviceId,
          vehicleName: vehicle.deviceName,
          type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
          severity: severities[Math.floor(Math.random() * severities.length)],
          message: messages[alertTypes[Math.floor(Math.random() * alertTypes.length)]],
          timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Last 24 hours
          location: `${(Math.random() * 90).toFixed(4)}, ${(Math.random() * 180).toFixed(4)}`,
          resolved: Math.random() > 0.7 // 30% chance of being resolved
        }));

      setAlerts(newAlerts);
    };

    generateAlerts();
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      if (Math.random() > 0.8) { // 20% chance of new alert every 30 seconds
        generateAlerts();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [vehicleAnalytics]);

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: Alert['type']) => {
    switch (type) {
      case 'maintenance':
        return <AlertTriangle className="h-4 w-4" />;
      case 'security':
        return <Bell className="h-4 w-4" />;
      case 'performance':
        return <CheckCircle className="h-4 w-4" />;
      case 'geofence':
        return <MapPin className="h-4 w-4" />;
      case 'fuel':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
  };

  const filteredAlerts = showResolved ? alerts : alerts.filter(alert => !alert.resolved);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Real-Time Alerts
            <Badge variant="secondary">
              {alerts.filter(a => !a.resolved).length} Active
            </Badge>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowResolved(!showResolved)}
          >
            {showResolved ? 'Hide Resolved' : 'Show All'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <div>No active alerts</div>
              <div className="text-sm">Your fleet is running smoothly</div>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)} ${
                  alert.resolved ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-1 rounded ${getSeverityColor(alert.severity)}`}>
                      {getTypeIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-medium">{alert.vehicleName}</div>
                        <Badge variant="outline" className="text-xs">
                          {alert.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {alert.severity}
                        </Badge>
                        {alert.resolved && (
                          <Badge variant="secondary" className="text-xs">
                            Resolved
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {alert.message}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {alert.timestamp.toLocaleString()}
                        </div>
                        {alert.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {alert.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {!alert.resolved && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => resolveAlert(alert.id)}
                      className="ml-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RealTimeAlerts;
