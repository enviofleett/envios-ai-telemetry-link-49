
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface FleetStatusTableProps {
  vehicles: any[];
  selectedVehicle: any;
  controlStates: {
    engineState: Record<string, boolean>;
    lockState: Record<string, boolean>;
  };
  onVehicleSelect: (vehicle: any) => void;
}

const FleetStatusTable: React.FC<FleetStatusTableProps> = ({
  vehicles,
  selectedVehicle,
  controlStates,
  onVehicleSelect
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'offline':
        return <Badge className="bg-blue-100 text-blue-800">Idle</Badge>;
      case 'maintenance':
        return <Badge variant="destructive">Maintenance</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getIgnitionStatus = (deviceId: string) => {
    const isOn = controlStates.engineState[deviceId];
    return isOn ? (
      <div className="flex items-center">
        <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>On
      </div>
    ) : (
      <div className="flex items-center">
        <div className="h-2 w-2 rounded-full bg-gray-400 mr-2"></div>Off
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>GP51 Fleet Status</CardTitle>
        <CardDescription>Current status of all vehicles in your fleet</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device ID</TableHead>
              <TableHead>Device Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Speed</TableHead>
              <TableHead>Engine</TableHead>
              <TableHead>Last Update</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((vehicle) => (
              <TableRow 
                key={vehicle.deviceid} 
                className={selectedVehicle?.deviceid === vehicle.deviceid ? "bg-muted/50" : ""}
              >
                <TableCell className="font-medium">{vehicle.deviceid}</TableCell>
                <TableCell>{vehicle.devicename}</TableCell>
                <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                <TableCell>{vehicle.lastPosition?.speed || 0} km/h</TableCell>
                <TableCell>{getIgnitionStatus(vehicle.deviceid)}</TableCell>
                <TableCell>
                  {vehicle.lastPosition?.updatetime ? 
                    new Date(vehicle.lastPosition.updatetime).toLocaleString() : 
                    'No data'
                  }
                </TableCell>
                <TableCell>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onVehicleSelect(vehicle)}
                  >
                    Select
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default FleetStatusTable;
