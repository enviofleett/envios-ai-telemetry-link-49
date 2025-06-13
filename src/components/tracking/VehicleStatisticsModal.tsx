
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, 
  Activity, 
  MapPin, 
  Clock, 
  Fuel, 
  TrendingUp,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import type { VehicleData } from '@/services/unifiedVehicleData';

interface VehicleStatisticsModalProps {
  vehicle: VehicleData;
  children: React.ReactNode;
}

const VehicleStatisticsModal: React.FC<VehicleStatisticsModalProps> = ({ vehicle, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Mock statistics data
  const getVehicleStatistics = (vehicle: VehicleData) => {
    const stats = {
      totalDistance: Math.floor(Math.random() * 5000 + 1000),
      totalTrips: Math.floor(Math.random() * 100 + 20),
      averageSpeed: Math.floor(Math.random() * 40 + 30),
      fuelConsumption: Math.floor(Math.random() * 200 + 100),
      idleTime: Math.floor(Math.random() * 50 + 10),
      drivingTime: Math.floor(Math.random() * 300 + 100),
      alerts: Math.floor(Math.random() * 10),
      efficiency: Math.floor(Math.random() * 30 + 70)
    };

    return stats;
  };

  const getVehicleStatus = () => {
    if (!vehicle.last_position?.timestamp) return 'offline';
    
    const lastUpdate = new Date(vehicle.last_position.timestamp);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (minutesSinceUpdate <= 5) return 'online';
    if (minutesSinceUpdate <= 30) return 'idle';
    return 'offline';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const stats = getVehicleStatistics(vehicle);
  const status = getVehicleStatus();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6" />
            Vehicle Statistics - {vehicle.device_name}
            <Badge variant="outline">ID: {vehicle.device_id}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`}></div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-semibold capitalize">{status}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-semibold">
                      {vehicle.last_position ? 
                        `${vehicle.last_position.lat.toFixed(4)}, ${vehicle.last_position.lng.toFixed(4)}` : 
                        'Unknown'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Speed</p>
                    <p className="font-semibold">
                      {vehicle.last_position?.speed || 0} km/h
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold text-blue-600">{stats.totalDistance}</p>
                  <p className="text-sm text-gray-600">Total Distance (km)</p>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <MapPin className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold text-green-600">{stats.totalTrips}</p>
                  <p className="text-sm text-gray-600">Total Trips</p>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-2xl font-bold text-purple-600">{stats.averageSpeed}</p>
                  <p className="text-sm text-gray-600">Avg Speed (km/h)</p>
                </div>

                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Fuel className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <p className="text-2xl font-bold text-orange-600">{stats.fuelConsumption}</p>
                  <p className="text-sm text-gray-600">Fuel Used (L)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Time Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-semibold">{stats.drivingTime}h</p>
                      <p className="text-sm text-gray-600">Driving Time</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="font-semibold">{stats.idleTime}h</p>
                      <p className="text-sm text-gray-600">Idle Time</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-semibold">{stats.alerts}</p>
                      <p className="text-sm text-gray-600">Alerts</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Efficiency Score */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Efficiency Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 mb-4">
                  <span className="text-3xl font-bold text-green-600">{stats.efficiency}%</span>
                </div>
                <p className="text-lg font-semibold mb-2">Excellent Performance</p>
                <p className="text-gray-600">Based on fuel consumption, driving patterns, and maintenance schedule</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleStatisticsModal;
