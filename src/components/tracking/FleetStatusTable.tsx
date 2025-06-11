
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
  TableRow,
} from '@/components/ui/table';
import { 
  Activity, 
  MapPin, 
  Clock,
  Car
} from 'lucide-react';

interface FleetStatusTableProps {
  vehicles: any[];
  selectedVehicle: any;
  controlStates: any;
  onVehicleSelect: (vehicle: any) => void;
}

export default function FleetStatusTable({ 
  vehicles, 
  selectedVehicle, 
  controlStates, 
  onVehicleSelect 
}: FleetStatusTableProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'online': 'bg-green-100 text-green-800',
      'moving': 'bg-blue-100 text-blue-800',
      'idle': 'bg-yellow-100 text-yellow-800',
      'offline': 'bg-red-100 text-red-800'
    };
    
    const color = statusConfig[status as keyof typeof statusConfig] || statusConfig.offline;
    
    return (
      <Badge className={color}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatLastUpdate = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Fleet Status
          <Badge variant="secondary">
            {vehicles.length} vehicles
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {vehicles.length === 0 ? (
          <div className="text-center py-8">
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No vehicles available</p>
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
                  <TableHead>Last Update</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((vehicle) => {
                  const position = vehicle.lastPosition || vehicle.last_position;
                  const isSelected = selectedVehicle?.deviceId === vehicle.deviceId;
                  
                  return (
                    <TableRow 
                      key={vehicle.deviceId}
                      className={isSelected ? 'bg-blue-50' : ''}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${
                            vehicle.isOnline ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          {vehicle.deviceName || vehicle.device_name || `Device ${vehicle.deviceId}`}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {getStatusBadge(vehicle.status || 'offline')}
                      </TableCell>
                      
                      <TableCell>
                        {position ? (
                          <div className="flex items-center gap-1 text-xs">
                            <MapPin className="h-3 w-3" />
                            {position.lat?.toFixed(4)}, {position.lon?.toFixed(4)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">No location</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <span className="text-sm">
                          {position?.speed || 0} km/h
                        </span>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatLastUpdate(vehicle.lastUpdate || vehicle.updated_at)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Button
                          size="sm"
                          variant={isSelected ? "default" : "outline"}
                          onClick={() => onVehicleSelect(vehicle)}
                        >
                          {isSelected ? "Selected" : "Select"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
