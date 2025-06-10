
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Car, MapPin, Clock, AlertTriangle, Eye } from 'lucide-react';

const VehicleManagementPanel: React.FC = () => {
  // Mock vehicle data
  const vehicles = [
    {
      id: 'V001',
      name: 'Fleet Vehicle 001',
      status: 'active',
      location: 'Downtown Office',
      lastUpdate: '2 minutes ago',
      speed: '45 km/h',
      fuel: 85,
      alerts: 0
    },
    {
      id: 'V002',
      name: 'Fleet Vehicle 002',
      status: 'idle',
      location: 'North Warehouse',
      lastUpdate: '5 minutes ago',
      speed: '0 km/h',
      fuel: 62,
      alerts: 1
    },
    {
      id: 'V003',
      name: 'Fleet Vehicle 003',
      status: 'active',
      location: 'Highway 101',
      lastUpdate: '1 minute ago',
      speed: '78 km/h',
      fuel: 45,
      alerts: 0
    },
    {
      id: 'V004',
      name: 'Fleet Vehicle 004',
      status: 'maintenance',
      location: 'Service Center',
      lastUpdate: '1 hour ago',
      speed: '0 km/h',
      fuel: 30,
      alerts: 2
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'idle': return 'bg-yellow-100 text-yellow-800';
      case 'maintenance': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFuelColor = (fuel: number) => {
    if (fuel > 50) return 'text-green-600';
    if (fuel > 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          Vehicle Fleet Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Car className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{vehicle.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-3 w-3" />
                    <span>{vehicle.location}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-sm font-medium">{vehicle.speed}</div>
                  <div className="text-xs text-gray-500">Speed</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-sm font-medium ${getFuelColor(vehicle.fuel)}`}>
                    {vehicle.fuel}%
                  </div>
                  <div className="text-xs text-gray-500">Fuel</div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(vehicle.status)}>
                    {vehicle.status}
                  </Badge>
                  {vehicle.alerts > 0 && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {vehicle.alerts}
                    </Badge>
                  )}
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                    <Clock className="h-3 w-3" />
                    {vehicle.lastUpdate}
                  </div>
                  <Button size="sm" variant="outline">
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {vehicles.length} vehicles
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              View All Vehicles
            </Button>
            <Button size="sm">
              Add Vehicle
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleManagementPanel;
