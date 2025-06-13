
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MapPin,
  Clock,
  Route,
  Gauge,
  Calendar
} from 'lucide-react';
import type { VehicleData } from '@/types/vehicle';

interface TripHistoryModalProps {
  vehicle: VehicleData | null;
  isOpen: boolean;
  onClose: () => void;
}

interface TripRecord {
  id: string;
  startTime: string;
  endTime: string;
  startLocation: string;
  endLocation: string;
  distance: number;
  duration: string;
  averageSpeed: number;
  maxSpeed: number;
  status: 'completed' | 'ongoing' | 'interrupted';
}

const TripHistoryModal: React.FC<TripHistoryModalProps> = ({
  vehicle,
  isOpen,
  onClose
}) => {
  if (!vehicle) return null;

  // Mock trip data - in a real app, this would come from an API
  const mockTrips: TripRecord[] = [
    {
      id: '1',
      startTime: '2024-01-15 08:30',
      endTime: '2024-01-15 12:45',
      startLocation: 'Warehouse A',
      endLocation: 'Customer Site B',
      distance: 125.5,
      duration: '4h 15m',
      averageSpeed: 45,
      maxSpeed: 78,
      status: 'completed'
    },
    {
      id: '2',
      startTime: '2024-01-15 14:00',
      endTime: '2024-01-15 16:30',
      startLocation: 'Customer Site B',
      endLocation: 'Depot C',
      distance: 87.2,
      duration: '2h 30m',
      averageSpeed: 52,
      maxSpeed: 85,
      status: 'completed'
    },
    {
      id: '3',
      startTime: '2024-01-16 09:15',
      endTime: 'Ongoing',
      startLocation: 'Depot C',
      endLocation: 'In Transit',
      distance: 45.8,
      duration: '1h 45m',
      averageSpeed: 38,
      maxSpeed: 65,
      status: 'ongoing'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'ongoing': return 'secondary';
      case 'interrupted': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Trip History - {vehicle.device_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">3</div>
              <div className="text-sm text-gray-600">Total Trips</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">258.5</div>
              <div className="text-sm text-gray-600">Total Distance (km)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">8h 30m</div>
              <div className="text-sm text-gray-600">Total Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">45</div>
              <div className="text-sm text-gray-600">Avg Speed (km/h)</div>
            </div>
          </div>

          {/* Trip List */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {mockTrips.map((trip) => (
                <div key={trip.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">
                        {trip.startTime} - {trip.endTime}
                      </span>
                    </div>
                    <Badge variant={getStatusColor(trip.status)}>
                      {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Start:</span>
                        <span className="text-sm">{trip.startLocation}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium">End:</span>
                        <span className="text-sm">{trip.endLocation}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Route className="h-3 w-3 text-gray-400" />
                        <span>{trip.distance} km</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span>{trip.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Gauge className="h-3 w-3 text-gray-400" />
                        <span>{trip.averageSpeed} km/h avg</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Gauge className="h-3 w-3 text-gray-400" />
                        <span>{trip.maxSpeed} km/h max</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button variant="outline" size="sm">
                      View Route
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Export History
              </Button>
              <Button size="sm">
                View All Trips
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TripHistoryModal;
