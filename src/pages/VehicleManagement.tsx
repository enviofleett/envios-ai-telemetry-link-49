
import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Car, 
  Plus, 
  MapPin, 
  Battery, 
  Signal,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings
} from 'lucide-react';

interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  status: 'online' | 'offline' | 'maintenance' | 'alert';
  location: string;
  battery: number;
  signal: number;
  lastUpdate: string;
  mileage: number;
  nextMaintenance: string;
}

const mockVehicles: Vehicle[] = [
  {
    id: 'FL-001',
    plateNumber: 'ABC-1234',
    model: 'Ford Transit 2022',
    status: 'online',
    location: 'Downtown Office',
    battery: 87,
    signal: 95,
    lastUpdate: '2 minutes ago',
    mileage: 45620,
    nextMaintenance: '2024-03-15'
  },
  {
    id: 'FL-002',
    plateNumber: 'XYZ-5678',
    model: 'Mercedes Sprinter 2023',
    status: 'offline',
    location: 'Warehouse District',
    battery: 23,
    signal: 0,
    lastUpdate: '1 hour ago',
    mileage: 32150,
    nextMaintenance: '2024-03-20'
  },
  {
    id: 'FL-003',
    plateNumber: 'DEF-9012',
    model: 'Iveco Daily 2021',
    status: 'alert',
    location: 'Service Center',
    battery: 45,
    signal: 78,
    lastUpdate: '5 minutes ago',
    mileage: 67890,
    nextMaintenance: '2024-03-10'
  }
];

const VehicleManagement: React.FC = () => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800">Online</Badge>;
      case 'offline':
        return <Badge className="bg-gray-100 text-gray-800">Offline</Badge>;
      case 'maintenance':
        return <Badge className="bg-blue-100 text-blue-800">Maintenance</Badge>;
      case 'alert':
        return <Badge variant="destructive">Alert</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'offline':
        return <Clock className="h-4 w-4 text-gray-600" />;
      case 'maintenance':
        return <Settings className="h-4 w-4 text-blue-600" />;
      case 'alert':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Car className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vehicle Management</h1>
            <p className="text-muted-foreground">
              Monitor and manage your fleet vehicles
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Vehicle
          </Button>
        </div>

        {/* Fleet Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
              <Car className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockVehicles.length}</div>
              <p className="text-xs text-muted-foreground">Active fleet</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockVehicles.filter(v => v.status === 'online').length}
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round((mockVehicles.filter(v => v.status === 'online').length / mockVehicles.length) * 100)}% of fleet
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockVehicles.filter(v => v.status === 'alert').length}
              </div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maintenance Due</CardTitle>
              <Settings className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Next 7 days</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="fleet" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="fleet">Fleet Overview</TabsTrigger>
            <TabsTrigger value="tracking">Live Tracking</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>

          <TabsContent value="fleet" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Fleet</CardTitle>
                <CardDescription>
                  Overview of all vehicles in your fleet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockVehicles.map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          {getStatusIcon(vehicle.status)}
                        </div>
                        <div>
                          <div className="font-medium">{vehicle.plateNumber}</div>
                          <div className="text-sm text-muted-foreground">{vehicle.model}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {vehicle.location}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm">
                            <Battery className="h-3 w-3 inline mr-1" />
                            {vehicle.battery}%
                          </div>
                          <div className="text-sm">
                            <Signal className="h-3 w-3 inline mr-1" />
                            {vehicle.signal}%
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{vehicle.mileage.toLocaleString()} km</div>
                          <div className="text-xs text-muted-foreground">
                            Updated {vehicle.lastUpdate}
                          </div>
                        </div>
                        {getStatusBadge(vehicle.status)}
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Live Vehicle Tracking</CardTitle>
                <CardDescription>
                  Real-time location and status of your vehicles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Live tracking map will be displayed here</p>
                  <Button className="mt-4" onClick={() => window.location.href = '/tracking'}>
                    Go to Live Tracking
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Schedule</CardTitle>
                <CardDescription>
                  Upcoming maintenance for your vehicles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockVehicles.map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Settings className="h-4 w-4 text-orange-600" />
                        <div>
                          <div className="font-medium">{vehicle.plateNumber}</div>
                          <div className="text-sm text-muted-foreground">
                            Next maintenance: {vehicle.nextMaintenance}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Schedule
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default VehicleManagement;
