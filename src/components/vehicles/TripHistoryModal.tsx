
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar,
  MapPin, 
  Clock, 
  Route, 
  Activity,
  Download,
  RefreshCw
} from 'lucide-react';
import type { VehicleData } from '@/services/unifiedVehicleData';

interface TripHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: VehicleData | null;
}

interface TripRecord {
  id: string;
  startTime: string;
  endTime: string;
  startLocation: { lat: number; lng: number; address: string };
  endLocation: { lat: number; lng: number; address: string };
  distance: number;
  duration: number;
  averageSpeed: number;
  maxSpeed: number;
  fuelConsumed: number;
  status: 'completed' | 'in-progress' | 'interrupted';
}

const TripHistoryModal: React.FC<TripHistoryModalProps> = ({ isOpen, onClose, vehicle }) => {
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState('7days');

  useEffect(() => {
    if (isOpen && vehicle) {
      loadTripHistory();
    }
  }, [isOpen, vehicle, dateRange]);

  const loadTripHistory = async () => {
    setIsLoading(true);
    
    try {
      // Mock API call to fetch trip history
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock trip data
      const mockTrips: TripRecord[] = Array.from({ length: 10 }, (_, index) => {
        const startTime = new Date(Date.now() - (index * 24 * 60 * 60 * 1000) - Math.random() * 12 * 60 * 60 * 1000);
        const duration = Math.floor(Math.random() * 120 + 30); // 30-150 minutes
        const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
        const distance = Math.floor(Math.random() * 200 + 10); // 10-210 km
        
        return {
          id: `trip-${index}`,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          startLocation: {
            lat: 40.7128 + (Math.random() - 0.5) * 0.1,
            lng: -74.0060 + (Math.random() - 0.5) * 0.1,
            address: `Start Location ${index + 1}`
          },
          endLocation: {
            lat: 40.7128 + (Math.random() - 0.5) * 0.1,
            lng: -74.0060 + (Math.random() - 0.5) * 0.1,
            address: `End Location ${index + 1}`
          },
          distance,
          duration,
          averageSpeed: Math.floor(distance / (duration / 60)),
          maxSpeed: Math.floor(Math.random() * 40 + 60),
          fuelConsumed: Number((distance * 0.08).toFixed(1)),
          status: Math.random() > 0.1 ? 'completed' : 'interrupted'
        };
      });
      
      setTrips(mockTrips);
    } catch (error) {
      console.error('Error loading trip history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in-progress': return 'secondary';
      case 'interrupted': return 'destructive';
      default: return 'outline';
    }
  };

  if (!vehicle) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Trip History - {vehicle.device_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
              </select>
              
              <Button variant="outline" size="sm" onClick={loadTripHistory} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Trip List */}
          <ScrollArea className="h-96">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                Loading trip history...
              </div>
            ) : trips.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Route className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No trips found for the selected period</p>
              </div>
            ) : (
              <div className="space-y-3">
                {trips.map((trip) => (
                  <div key={trip.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">
                          {new Date(trip.startTime).toLocaleDateString()}
                        </span>
                        <Badge variant={getStatusColor(trip.status)}>
                          {trip.status}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        {formatDuration(trip.duration)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      {/* Start Location */}
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-green-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Start</p>
                          <p className="text-xs text-gray-600">{trip.startLocation.address}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(trip.startTime).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>

                      {/* End Location */}
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-red-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">End</p>
                          <p className="text-xs text-gray-600">{trip.endLocation.address}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(trip.endTime).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Trip Stats */}
                    <div className="grid grid-cols-4 gap-4 text-center text-sm">
                      <div>
                        <p className="font-medium">{trip.distance} km</p>
                        <p className="text-gray-600">Distance</p>
                      </div>
                      <div>
                        <p className="font-medium">{trip.averageSpeed} km/h</p>
                        <p className="text-gray-600">Avg Speed</p>
                      </div>
                      <div>
                        <p className="font-medium">{trip.maxSpeed} km/h</p>
                        <p className="text-gray-600">Max Speed</p>
                      </div>
                      <div>
                        <p className="font-medium">{trip.fuelConsumed} L</p>
                        <p className="text-gray-600">Fuel</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TripHistoryModal;
