
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, MapPin, Plus, Edit, Trash2, Eye, Bell } from 'lucide-react';

const GeofencingTab: React.FC = () => {
  const [geofencingEnabled, setGeofencingEnabled] = useState(true);

  const geofences = [
    {
      id: '1',
      name: 'Company Headquarters',
      type: 'circular',
      radius: 500,
      address: '123 Business Ave, City Center',
      status: 'active',
      vehicles: 15,
      alerts: {
        entry: true,
        exit: true,
        speed: false
      }
    },
    {
      id: '2',
      name: 'Warehouse District',
      type: 'polygon',
      radius: null,
      address: 'Industrial Zone, Sector 7',
      status: 'active',
      vehicles: 8,
      alerts: {
        entry: true,
        exit: true,
        speed: true
      }
    },
    {
      id: '3',
      name: 'Client Site A',
      type: 'circular',
      radius: 200,
      address: '456 Client Street, Downtown',
      status: 'inactive',
      vehicles: 3,
      alerts: {
        entry: false,
        exit: true,
        speed: false
      }
    }
  ];

  const recentAlerts = [
    {
      id: '1',
      vehicle: 'Fleet-001',
      geofence: 'Company Headquarters',
      type: 'exit',
      timestamp: '2024-01-15 14:30:00',
      driver: 'John Doe'
    },
    {
      id: '2',
      vehicle: 'Fleet-015',
      geofence: 'Warehouse District',
      type: 'entry',
      timestamp: '2024-01-15 14:25:00',
      driver: 'Jane Smith'
    },
    {
      id: '3',
      vehicle: 'Fleet-008',
      geofence: 'Client Site A',
      type: 'speed_violation',
      timestamp: '2024-01-15 14:20:00',
      driver: 'Mike Johnson'
    }
  ];

  const getTypeIcon = (type: string) => {
    return type === 'circular' ? '○' : '▢';
  };

  const getAlertIcon = (type: string) => {
    const icons = {
      entry: '→',
      exit: '←',
      speed_violation: '⚡'
    };
    return icons[type as keyof typeof icons] || '•';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Geofencing Management
          </CardTitle>
          <CardDescription>
            Manage virtual boundaries and location-based alerts for your fleet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="geofencing-enabled"
                checked={geofencingEnabled}
                onCheckedChange={setGeofencingEnabled}
              />
              <Label htmlFor="geofencing-enabled">
                Enable Geofencing System
              </Label>
            </div>
            <Button className="flex items-center gap-2" disabled={!geofencingEnabled}>
              <Plus className="h-4 w-4" />
              Create Geofence
            </Button>
          </div>

          <Tabs defaultValue="geofences" className="space-y-4">
            <TabsList>
              <TabsTrigger value="geofences">Geofences</TabsTrigger>
              <TabsTrigger value="alerts">Recent Alerts</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="geofences" className="space-y-4">
              <div className="grid gap-4">
                {geofences.map((geofence) => (
                  <Card key={geofence.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-lg">{getTypeIcon(geofence.type)}</span>
                            <h3 className="font-medium">{geofence.name}</h3>
                            <Badge 
                              variant={geofence.status === 'active' ? 'default' : 'secondary'}
                            >
                              {geofence.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{geofence.address}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {geofence.radius && (
                              <span>Radius: {geofence.radius}m</span>
                            )}
                            <span>Vehicles: {geofence.vehicles}</span>
                            <span>
                              Alerts: {Object.values(geofence.alerts).filter(Boolean).length}/3
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Recent Geofence Alerts</h3>
                {recentAlerts.map((alert) => (
                  <Card key={alert.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{getAlertIcon(alert.type)}</span>
                          <div>
                            <div className="font-medium">
                              {alert.vehicle} - {alert.type.replace('_', ' ')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Geofence: {alert.geofence} | Driver: {alert.driver}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {alert.timestamp}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {alert.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Geofencing Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="instant-alerts">Instant Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Send immediate notifications for geofence violations
                        </p>
                      </div>
                      <Switch id="instant-alerts" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Send email alerts for geofence events
                        </p>
                      </div>
                      <Switch id="email-notifications" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="sms-notifications">SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Send SMS alerts for critical violations
                        </p>
                      </div>
                      <Switch id="sms-notifications" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="alert-clustering">Alert Clustering</Label>
                        <p className="text-sm text-muted-foreground">
                          Group similar alerts to reduce notification spam
                        </p>
                      </div>
                      <Switch id="alert-clustering" defaultChecked />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeofencingTab;
