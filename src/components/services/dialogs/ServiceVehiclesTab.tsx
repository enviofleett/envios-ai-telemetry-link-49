
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ActiveService } from '@/types/active-services';

interface ServiceVehiclesTabProps {
  selectedService: ActiveService;
  getStatusBadge: (status: string) => React.ReactElement;
}

const ServiceVehiclesTab: React.FC<ServiceVehiclesTabProps> = ({
  selectedService,
  getStatusBadge,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Assignment</CardTitle>
        <CardDescription>Vehicles using this service</CardDescription>
      </CardHeader>
      <CardContent>
        {selectedService.vehicles.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Activated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedService.vehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">{vehicle.plateNumber}</TableCell>
                  <TableCell>{vehicle.model}</TableCell>
                  <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                  <TableCell>{vehicle.activatedDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            No vehicles assigned to this service
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceVehiclesTab;
