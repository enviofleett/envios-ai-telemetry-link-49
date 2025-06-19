
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import GeofenceManager from './GeofenceManager';
import GeofenceAlerts from './GeofenceAlerts';
import { useGeofencing } from '@/hooks/useGeofencing';
import { MapPin, AlertTriangle, Shield, Activity } from 'lucide-react';

const GeofencingPage: React.FC = () => {
  const { geofences, alerts, isLoading } = useGeofencing();
  const [selectedTab, setSelectedTab] = useState('overview');

  const activeGeofences = geofences.filter(g => g.is_active);
  const unacknowledgedAlerts = alerts.filter(a => !a.is_acknowledged);
  const recentAlerts = alerts.slice(0, 5);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading geofencing data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Geofencing</h1>
        <Badge variant="outline" className="text-sm">
          {activeGeofences.length} Active Zones
        </Badge>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="geofences">Geofences</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Geofences</CardTitle>
                <MapPin className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeGeofences.length}</div>
                <p className="text-xs text-muted-foreground">
                  Total zones monitoring
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unacknowledged Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{unacknowledgedAlerts.length}</div>
                <p className="text-xs text-muted-foreground">
                  Require attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Alerts Today</CardTitle>
                <Activity className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {alerts.filter(a => 
                    new Date(a.triggered_at).toDateString() === new Date().toDateString()
                  ).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Since midnight
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Status</CardTitle>
                <Shield className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Active</div>
                <p className="text-xs text-muted-foreground">
                  All systems operational
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                {recentAlerts.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    No recent alerts
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentAlerts.map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          <span className="text-sm">
                            {alert.device_id} {alert.alert_type === 'enter' ? 'entered' : 'exited'} zone
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(alert.triggered_at).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Geofences</CardTitle>
              </CardHeader>
              <CardContent>
                {activeGeofences.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    No active geofences
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeGeofences.slice(0, 5).map((geofence) => (
                      <div key={geofence.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">{geofence.name}</span>
                        </div>
                        <Badge variant={geofence.fence_type === 'inclusion' ? 'default' : 'destructive'} className="text-xs">
                          {geofence.fence_type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geofences">
          <GeofenceManager />
        </TabsContent>

        <TabsContent value="alerts">
          <GeofenceAlerts />
        </TabsContent>

        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8">
                Real-time monitoring interface will be integrated with the existing 
                live tracking system to automatically check vehicle positions against geofences.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GeofencingPage;
