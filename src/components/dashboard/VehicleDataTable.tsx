import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin,
  Gauge,
  Navigation
} from 'lucide-react';
import { useEnhancedVehicleData } from '@/hooks/useEnhancedVehicleData';

const VehicleDataTable: React.FC = () => {
  const { vehicles, isLoading } = useEnhancedVehicleData();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'default';
      case 'offline': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatLastUpdate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const formatLocation = (latitude?: number, longitude?: number) => {
    if (!latitude || !longitude) return 'Unknown';
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading vehicle data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Live Vehicle Data</CardTitle>
          <Badge variant="outline">
            {vehicles.length} vehicles
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {vehicles.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Vehicle Data</h3>
              <p className="text-gray-500 mb-4">
                No vehicles are currently reporting data. This could be due to:
              </p>
              <ul className="text-sm text-gray-500 list-disc list-inside text-left max-w-md mx-auto">
                <li>GP51 authentication issues</li>
                <li>No vehicles configured in GP51</li>
                <li>Network connectivity problems</li>
                <li>All vehicles are currently offline</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Speed</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Last Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.slice(0, 20).map((vehicle) => (
                  <TableRow key={vehicle.device_id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{vehicle.device_name}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {vehicle.device_id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={getStatusColor(vehicle.status)} 
                        className="flex items-center gap-1 w-fit"
                      >
                        {getStatusIcon(vehicle.status)}
                        {vehicle.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {formatLocation(vehicle.last_position?.latitude, vehicle.last_position?.longitude)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Gauge className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {vehicle.speed !== undefined ? `${vehicle.speed} km/h` : 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Navigation className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {vehicle.course !== undefined ? `${vehicle.course}°` : 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatLastUpdate(vehicle.lastUpdate)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {vehicles.length > 20 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Showing 20 of {vehicles.length} vehicles
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VehicleDataTable;
