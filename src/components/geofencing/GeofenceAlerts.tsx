
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { geofencingService, type GeofenceAlert } from '@/services/geofencingService';
import { AlertTriangle, CheckCircle, Clock, MapPin } from 'lucide-react';

interface GeofenceAlertsProps {
  deviceId?: string;
}

const GeofenceAlerts: React.FC<GeofenceAlertsProps> = ({ deviceId }) => {
  const [alerts, setAlerts] = useState<GeofenceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAlerts();
  }, [deviceId]);

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      const data = await geofencingService.getGeofenceAlerts(deviceId);
      setAlerts(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load geofence alerts",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      await geofencingService.acknowledgeAlert(alertId);
      toast({
        title: "Success",
        description: "Alert acknowledged successfully"
      });
      loadAlerts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to acknowledge alert",
        variant: "destructive"
      });
    }
  };

  const getAlertIcon = (alertType: string, isAcknowledged: boolean) => {
    if (isAcknowledged) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    return alertType === 'enter' ? 
      <AlertTriangle className="h-4 w-4 text-orange-600" /> : 
      <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  const getAlertColor = (alertType: string, isAcknowledged: boolean) => {
    if (isAcknowledged) return 'default';
    return alertType === 'enter' ? 'destructive' : 'secondary';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading alerts...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Geofence Alerts
          {deviceId && <span className="text-sm text-gray-500">for {deviceId}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No geofence alerts found.
            </div>
          ) : (
            alerts.map((alert) => (
              <Card key={alert.id} className="border-l-4 border-l-orange-500">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getAlertIcon(alert.alert_type, alert.is_acknowledged)}
                        <span className="font-semibold">
                          Vehicle {alert.alert_type === 'enter' ? 'entered' : 'exited'} geofence
                        </span>
                        <Badge variant={getAlertColor(alert.alert_type, alert.is_acknowledged)}>
                          {alert.alert_type.toUpperCase()}
                        </Badge>
                        {alert.is_acknowledged && (
                          <Badge variant="outline">Acknowledged</Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>Device: {alert.device_id}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {new Date(alert.triggered_at).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          Location: {alert.location.lat.toFixed(6)}, {alert.location.lng.toFixed(6)}
                        </div>
                      </div>

                      {alert.is_acknowledged && alert.acknowledged_at && (
                        <div className="mt-3 text-xs text-gray-500">
                          Acknowledged on {new Date(alert.acknowledged_at).toLocaleString()}
                        </div>
                      )}
                    </div>

                    {!alert.is_acknowledged && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcknowledge(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GeofenceAlerts;
