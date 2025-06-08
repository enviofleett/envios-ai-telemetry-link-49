
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Car, MapPin, Clock, Battery, Signal } from 'lucide-react';

const VehicleManagementPanel: React.FC = () => {
  // Mock data - in real implementation, this would come from your API
  const vehicles = [
    {
      id: 'VH001',
      name: 'Fleet Vehicle 01',
      status: 'online',
      location: 'Downtown Area',
      lastUpdate: '2 min ago',
      battery: 85,
      signal: 'Strong',
      driver: 'John Doe'
    },
    {
      id: 'VH002',
      name: 'Fleet Vehicle 02',
      status: 'moving',
      location: 'Highway 101',
      lastUpdate: '1 min ago',
      battery: 92,
      signal: 'Strong',
      driver: 'Jane Smith'
    },
    {
      id: 'VH003',
      name: 'Fleet Vehicle 03',
      status: 'offline',
      location: 'Parking Lot A',
      lastUpdate: '15 min ago',
      battery: 45,
      signal: 'Weak',
      driver: 'Mike Johnson'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Online</Badge>;
      case 'moving':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Moving</Badge>;
      case 'offline':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Offline</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getBatteryColor = (level: number) => {
    if (level >= 70) return 'text-green-600';
    if (level >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          Vehicle Fleet Overview
        </CardTitle>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Vehicle
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Car className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{vehicle.name}</h4>
                  <p className="text-sm text-gray-500">ID: {vehicle.id}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Status</p>
                  {getStatusBadge(vehicle.status)}
                </div>
                
                <div className="text-center">
                  <p className="text-xs text-gray-500">Location</p>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    <p className="text-sm font-medium">{vehicle.location}</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-xs text-gray-500">Battery</p>
                  <div className="flex items-center gap-1">
                    <Battery className={`h-3 w-3 ${getBatteryColor(vehicle.battery)}`} />
                    <p className={`text-sm font-medium ${getBatteryColor(vehicle.battery)}`}>
                      {vehicle.battery}%
                    </p>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-xs text-gray-500">Signal</p>
                  <div className="flex items-center gap-1">
                    <Signal className="h-3 w-3 text-gray-400" />
                    <p className="text-sm font-medium">{vehicle.signal}</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-xs text-gray-500">Last Update</p>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <p className="text-sm">{vehicle.lastUpdate}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleManagementPanel;
