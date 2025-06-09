
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ActiveService, ServiceUpdateRequest } from '@/types/active-services';
import ServiceDialogHeader from './dialogs/ServiceDialogHeader';
import ServiceSettingsTab from './dialogs/ServiceSettingsTab';
import ServiceVehiclesTab from './dialogs/ServiceVehiclesTab';
import ServiceBillingTab from './dialogs/ServiceBillingTab';
import ServiceFeaturesTab from './dialogs/ServiceFeaturesTab';
import ServiceDialogActions from './dialogs/ServiceDialogActions';

interface ServiceManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedService: ActiveService | null;
  onServiceUpdate: (serviceId: string, updates: ServiceUpdateRequest) => void;
  onServiceCancel: (serviceId: string) => void;
  onServiceRenew: (serviceId: string, newEndDate: string) => void;
}

const ServiceManagementDialog: React.FC<ServiceManagementDialogProps> = ({
  isOpen,
  onClose,
  selectedService,
  onServiceUpdate,
  onServiceCancel,
  onServiceRenew
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <ServiceDialogHeader 
          selectedService={selectedService}
          getStatusBadge={getStatusBadge}
        />

        {selectedService ? (
          <div className="space-y-6">
            <Tabs defaultValue="settings" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
              </TabsList>

              <TabsContent value="settings" className="space-y-4">
                <ServiceSettingsTab 
                  selectedService={selectedService}
                  onServiceUpdate={onServiceUpdate}
                />
              </TabsContent>

              <TabsContent value="vehicles" className="space-y-4">
                <ServiceVehiclesTab 
                  selectedService={selectedService}
                  getStatusBadge={getStatusBadge}
                />
              </TabsContent>

              <TabsContent value="billing" className="space-y-4">
                <ServiceBillingTab selectedService={selectedService} />
              </TabsContent>

              <TabsContent value="features" className="space-y-4">
                <ServiceFeaturesTab selectedService={selectedService} />
              </TabsContent>
            </Tabs>

            <ServiceDialogActions
              selectedService={selectedService}
              onClose={onClose}
              onServiceUpdate={onServiceUpdate}
              onServiceCancel={onServiceCancel}
            />
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No service selected</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ServiceManagementDialog;
