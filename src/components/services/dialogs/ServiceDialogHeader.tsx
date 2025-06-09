
import React from 'react';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ActiveService } from '@/types/active-services';

interface ServiceDialogHeaderProps {
  selectedService: ActiveService | null;
  getStatusBadge: (status: string) => React.ReactElement;
}

const ServiceDialogHeader: React.FC<ServiceDialogHeaderProps> = ({
  selectedService,
  getStatusBadge,
}) => {
  if (!selectedService) {
    return (
      <DialogHeader>
        <DialogTitle>Manage Subscriptions</DialogTitle>
        <DialogDescription>Configure your service subscriptions and billing preferences</DialogDescription>
      </DialogHeader>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Manage Service: {selectedService.serviceName}</DialogTitle>
        <DialogDescription>Configure service settings, billing, and vehicle assignments</DialogDescription>
      </DialogHeader>
      
      <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/20">
        <selectedService.icon className="h-8 w-8 text-primary" />
        <div>
          <h3 className="font-semibold">{selectedService.serviceName}</h3>
          <p className="text-sm text-muted-foreground">
            {selectedService.vehicles.length} vehicles • ${selectedService.monthlyFee.toFixed(2)}/month
          </p>
        </div>
        {getStatusBadge(selectedService.status)}
      </div>
    </>
  );
};

export default ServiceDialogHeader;
