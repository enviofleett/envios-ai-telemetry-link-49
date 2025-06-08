
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Pause, Trash2, CheckCircle, X } from 'lucide-react';
import { ActiveService, ServiceUpdateRequest } from '@/types/active-services';

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

  if (!selectedService) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Subscriptions</DialogTitle>
            <DialogDescription>Configure your service subscriptions and billing preferences</DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No service selected</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Service: {selectedService.serviceName}</DialogTitle>
          <DialogDescription>Configure service settings, billing, and vehicle assignments</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
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

          <Tabs defaultValue="settings" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="space-y-4">
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
            </TabsContent>

            <TabsContent value="vehicles" className="space-y-4">
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
            </TabsContent>

            <TabsContent value="billing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Billing Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Monthly Fee</Label>
                      <div className="text-2xl font-bold">${selectedService.monthlyFee.toFixed(2)}</div>
                    </div>
                    <div className="space-y-2">
                      <Label>Next Billing Date</Label>
                      <div className="text-lg">{selectedService.nextBillingDate}</div>
                    </div>
                    <div className="space-y-2">
                      <Label>Total Spent</Label>
                      <div className="text-lg">${selectedService.totalSpent.toFixed(2)}</div>
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span>**** 1234</span>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Update Payment Method
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Service Features</CardTitle>
                  <CardDescription>Features included with this service</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedService.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const newStatus = selectedService.status === 'active' ? 'paused' : 'active';
                  onServiceUpdate(selectedService.id, { status: newStatus });
                }}
              >
                <Pause className="h-4 w-4 mr-2" />
                {selectedService.status === 'active' ? 'Pause' : 'Resume'} Service
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (window.confirm('Are you sure you want to cancel this service? This action cannot be undone.')) {
                    onServiceCancel(selectedService.id);
                    onClose();
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Cancel Service
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceManagementDialog;
