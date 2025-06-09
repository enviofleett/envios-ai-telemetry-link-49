
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ActiveService, ServiceUpdateRequest } from '@/types/active-services';

interface ServiceSettingsTabProps {
  selectedService: ActiveService;
  onServiceUpdate: (serviceId: string, updates: ServiceUpdateRequest) => void;
}

const ServiceSettingsTab: React.FC<ServiceSettingsTabProps> = ({
  selectedService,
  onServiceUpdate,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="auto-renew">Auto-Renewal</Label>
            <p className="text-sm text-muted-foreground">Automatically renew this service</p>
          </div>
          <Switch
            id="auto-renew"
            checked={selectedService.autoRenew}
            onCheckedChange={(checked) =>
              onServiceUpdate(selectedService.id, { autoRenew: checked })
            }
          />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="notifications">Email Notifications</Label>
            <p className="text-sm text-muted-foreground">Receive email alerts and updates</p>
          </div>
          <Switch id="notifications" defaultChecked />
        </div>
        <Separator />
        <div className="space-y-2">
          <Label>Service Information</Label>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service Type:</span>
              <span className="capitalize">{selectedService.serviceType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Activated:</span>
              <span>{selectedService.activatedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expires:</span>
              <span>{selectedService.expiryDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Next Billing:</span>
              <span>{selectedService.nextBillingDate}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceSettingsTab;
