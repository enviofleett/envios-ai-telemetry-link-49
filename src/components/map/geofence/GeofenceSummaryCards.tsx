
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, CheckCircle, Bell, AlertTriangle } from 'lucide-react';
import type { Geofence, GeofenceAlert } from '@/services/geofencing';

interface GeofenceSummaryCardsProps {
  geofences: Geofence[];
  alerts: GeofenceAlert[];
}

const GeofenceSummaryCards: React.FC<GeofenceSummaryCardsProps> = ({ geofences, alerts }) => {
  const unacknowledgedAlerts = alerts.filter(alert => !alert.is_acknowledged);
  const alertsToday = alerts.filter(a => 
    new Date(a.triggered_at).toDateString() === new Date().toDateString()
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Geofences</p>
              <p className="text-2xl font-bold">{geofences.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold">{geofences.filter(g => g.is_active).length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-sm font-medium text-gray-600">Alerts Today</p>
              <p className="text-2xl font-bold">{alertsToday.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-gray-600">Unacknowledged</p>
              <p className="text-2xl font-bold">{unacknowledgedAlerts.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeofenceSummaryCards;
