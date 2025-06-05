
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock } from 'lucide-react';
import type { GeofenceAlert } from '@/services/geofencing';

interface UnacknowledgedAlertsProps {
  alerts: GeofenceAlert[];
  onAcknowledgeAlert: (alertId: string) => void;
}

const UnacknowledgedAlerts: React.FC<UnacknowledgedAlertsProps> = ({ 
  alerts, 
  onAcknowledgeAlert 
}) => {
  const getAlertIcon = (alertType: string) => {
    return alertType === 'enter' ? (
      <div className="w-2 h-2 rounded-full bg-green-500"></div>
    ) : (
      <div className="w-2 h-2 rounded-full bg-red-500"></div>
    );
  };

  if (alerts.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Unacknowledged Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.slice(0, 5).map((alert) => (
            <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getAlertIcon(alert.alert_type)}
                <div>
                  <div className="font-medium">
                    Vehicle {alert.device_id} {alert.alert_type === 'enter' ? 'entered' : 'exited'} geofence
                  </div>
                  <div className="text-sm text-gray-500">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {new Date(alert.triggered_at).toLocaleString()}
                  </div>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onAcknowledgeAlert(alert.id)}
              >
                Acknowledge
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UnacknowledgedAlerts;
