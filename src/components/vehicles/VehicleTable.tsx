
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, RefreshCw } from 'lucide-react';
import { EnhancedVehicle } from './EnhancedVehicleManagementPage';

interface VehicleTableProps {
  vehicles: EnhancedVehicle[];
  isLoading: boolean;
  onViewVehicle: (vehicle: EnhancedVehicle) => void;
}

export const VehicleTable: React.FC<VehicleTableProps> = ({
  vehicles,
  isLoading,
  onViewVehicle
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return <Badge className="bg-green-100 text-green-800">Online</Badge>;
      case "maintenance":
        return <Badge variant="destructive">Maintenance</Badge>;
      case "offline":
        return <Badge variant="secondary">Offline</Badge>;
      case "inactive":
        return <Badge variant="outline">Inactive</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Device Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Last Update</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                <div className="flex items-center justify-center">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Loading vehicles...
                </div>
              </TableCell>
            </TableRow>
          ) : vehicles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No vehicles found matching your criteria
              </TableCell>
            </TableRow>
          ) : (
            vehicles.map((vehicle) => (
              <TableRow key={vehicle.deviceid}>
                <TableCell className="font-medium">{vehicle.deviceid}</TableCell>
                <TableCell>{vehicle.devicename}</TableCell>
                <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                <TableCell>{vehicle.type}</TableCell>
                <TableCell>{vehicle.assignedTo}</TableCell>
                <TableCell>
                  {vehicle.lastPosition?.updatetime ? 
                    new Date(vehicle.lastPosition.updatetime).toLocaleString() : 
                    'No data'
                  }
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => onViewVehicle(vehicle)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
