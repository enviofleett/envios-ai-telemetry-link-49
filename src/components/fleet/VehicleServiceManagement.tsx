
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { gp51ServiceApi } from '@/services/gp51ServiceManagementApi';
import { 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  RefreshCw,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

const VehicleServiceManagement: React.FC = () => {
  const [isRenewalDialogOpen, setIsRenewalDialogOpen] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [renewalYears, setRenewalYears] = useState(1);
  const [isFree, setIsFree] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: expiringDevices, isLoading } = useQuery({
    queryKey: ['devices-near-expiration'],
    queryFn: () => gp51ServiceApi.getDevicesNearExpiration(30),
  });

  const renewalMutation = useMutation({
    mutationFn: async ({ deviceIds, years, free }: { deviceIds: number[], years: number, free: boolean }) => {
      const overduetime = new Date();
      overduetime.setFullYear(overduetime.getFullYear() + years);
      
      return gp51ServiceApi.chargeDevices({
        deviceids: deviceIds,
        years,
        free: free ? 1 : 0,
        overduetime: overduetime.toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices-near-expiration'] });
      setIsRenewalDialogOpen(false);
      setSelectedDevices([]);
      toast({ title: 'Service renewal completed successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Service renewal failed', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const handleRenewalSubmit = () => {
    if (selectedDevices.length === 0) {
      toast({ title: 'Please select at least one device', variant: 'destructive' });
      return;
    }

    const deviceIds = selectedDevices.map(id => parseInt(id));
    renewalMutation.mutate({ deviceIds, years: renewalYears, free: isFree });
  };

  const getServiceStatus = (device: any) => {
    const metadata = device.gp51_metadata as any;
    if (!metadata?.service_end_date) return 'unknown';
    
    const endDate = new Date(metadata.service_end_date);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 7) return 'critical';
    if (daysUntilExpiry <= 30) return 'warning';
    return 'active';
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      critical: 'bg-orange-100 text-orange-800',
      expired: 'bg-red-100 text-red-800',
      unknown: 'bg-gray-100 text-gray-800'
    };

    const icons = {
      active: <CheckCircle className="w-3 h-3" />,
      warning: <Clock className="w-3 h-3" />,
      critical: <AlertTriangle className="w-3 h-3" />,
      expired: <XCircle className="w-3 h-3" />,
      unknown: <Clock className="w-3 h-3" />
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || variants.unknown}>
        {icons[status as keyof typeof icons]}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Service Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Services</p>
                <p className="text-2xl font-bold">{expiringDevices?.length || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-orange-600">
                  {expiringDevices?.filter(d => getServiceStatus(d) === 'warning').length || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-red-600">
                  {expiringDevices?.filter(d => getServiceStatus(d) === 'critical').length || 0}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-red-600">
                  {expiringDevices?.filter(d => getServiceStatus(d) === 'expired').length || 0}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Management Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Service Management</span>
            <Dialog open={isRenewalDialogOpen} onOpenChange={setIsRenewalDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Renew Services
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Renew Device Services</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Selected Devices: {selectedDevices.length}</Label>
                  </div>
                  <div>
                    <Label htmlFor="years">Renewal Years</Label>
                    <Input
                      id="years"
                      type="number"
                      min="1"
                      max="10"
                      value={renewalYears}
                      onChange={(e) => setRenewalYears(parseInt(e.target.value))}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="free"
                      checked={isFree}
                      onChange={(e) => setIsFree(e.target.checked)}
                    />
                    <Label htmlFor="free">Free for life</Label>
                  </div>
                  <Button 
                    onClick={handleRenewalSubmit}
                    disabled={renewalMutation.isPending}
                    className="w-full"
                  >
                    {renewalMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Renew Services
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {expiringDevices && expiringDevices.length > 0 ? (
              expiringDevices.map((device: any) => {
                const status = getServiceStatus(device);
                const metadata = device.gp51_metadata as any;
                
                return (
                  <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedDevices.includes(device.device_id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDevices([...selectedDevices, device.device_id]);
                          } else {
                            setSelectedDevices(selectedDevices.filter(id => id !== device.device_id));
                          }
                        }}
                      />
                      <div>
                        <div className="font-medium">{device.device_name}</div>
                        <div className="text-sm text-gray-600">ID: {device.device_id}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm">
                          {metadata?.service_end_date 
                            ? new Date(metadata.service_end_date).toLocaleDateString()
                            : 'No service date'
                          }
                        </div>
                        <div className="text-xs text-gray-500">
                          {metadata?.service_years ? `${metadata.service_years} year plan` : 'Unknown plan'}
                        </div>
                      </div>
                      {getStatusBadge(status)}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No devices found with service information.</p>
                <p className="text-sm">Service data will appear here once devices are configured.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleServiceManagement;
