
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Settings } from 'lucide-react';
import { ActiveService } from '@/types/active-services';

interface ServiceTableViewProps {
  filteredServices: ActiveService[];
  onManage: (service: ActiveService) => void;
  getStatusBadge: (status: string) => React.ReactElement;
}

const ServiceTableView: React.FC<ServiceTableViewProps> = ({
  filteredServices,
  onManage,
  getStatusBadge,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Details</CardTitle>
        <CardDescription>Detailed view of all your active services</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Vehicles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Monthly Fee</TableHead>
              <TableHead>Total Spent</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredServices.map((service) => (
              <TableRow key={service.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <service.icon className="h-4 w-4 text-primary" />
                    <span className="font-medium">{service.serviceName}</span>
                  </div>
                </TableCell>
                <TableCell className="capitalize">{service.serviceType}</TableCell>
                <TableCell>{service.vehicles.length}</TableCell>
                <TableCell>{getStatusBadge(service.status)}</TableCell>
                <TableCell>
                  {service.monthlyFee > 0 ? `$${service.monthlyFee.toFixed(2)}` : 'One-time'}
                </TableCell>
                <TableCell>${service.totalSpent.toFixed(2)}</TableCell>
                <TableCell>{service.expiryDate}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onManage(service)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ServiceTableView;
