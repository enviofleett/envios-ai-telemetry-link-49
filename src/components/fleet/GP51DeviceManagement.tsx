
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Car, Settings, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { gp51DeviceApi } from '@/services/gp51DeviceManagementApi';
import { CreateDeviceRequest, EditDeviceRequest } from '@/types/gp51-device';

const GP51DeviceManagement = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [createFormData, setCreateFormData] = useState<Partial<CreateDeviceRequest>>({
    deviceenable: 1,
    loginenable: 1,
    timezone: 8, // GMT+8
    calmileageway: 0,
    groupid: 1,
    devicetype: 1,
    creater: 'admin' // This should come from current user context
  });
  const [editFormData, setEditFormData] = useState<Partial<EditDeviceRequest>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: deviceTypes } = useQuery({
    queryKey: ['gp51-device-types'],
    queryFn: () => gp51DeviceApi.queryDeviceTypes(),
  });

  const { data: devices, isLoading } = useQuery({
    queryKey: ['vehicles-management'],
    queryFn: async () => {
      // Use existing vehicle management endpoint
      const { data, error } = await supabase.functions.invoke('vehicle-management');
      if (error) throw error;
      return data.vehicles;
    },
  });

  const createDeviceMutation = useMutation({
    mutationFn: (deviceData: CreateDeviceRequest) => gp51DeviceApi.addDevice(deviceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles-management'] });
      setIsCreateDialogOpen(false);
      setCreateFormData({
        deviceenable: 1,
        loginenable: 1,
        timezone: 8,
        calmileageway: 0,
        groupid: 1,
        devicetype: 1,
        creater: 'admin'
      });
      toast({ title: 'Device created successfully in GP51' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error creating device', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const editDeviceMutation = useMutation({
    mutationFn: (deviceData: EditDeviceRequest) => gp51DeviceApi.editDevice(deviceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles-management'] });
      setIsEditDialogOpen(false);
      setSelectedDevice(null);
      toast({ title: 'Device updated successfully in GP51' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error updating device', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const deleteDeviceMutation = useMutation({
    mutationFn: (deviceid: string) => gp51DeviceApi.deleteDevice(deviceid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles-management'] });
      toast({ title: 'Device deleted successfully from GP51' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error deleting device', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const handleCreateDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.deviceid || !createFormData.devicename) {
      toast({ title: 'Device ID and name are required', variant: 'destructive' });
      return;
    }
    createDeviceMutation.mutate(createFormData as CreateDeviceRequest);
  };

  const handleEditDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.deviceid || !editFormData.devicename) {
      toast({ title: 'Device ID and name are required', variant: 'destructive' });
      return;
    }
    editDeviceMutation.mutate(editFormData as EditDeviceRequest);
  };

  const handleDeleteDevice = (deviceid: string) => {
    if (confirm(`Are you sure you want to delete device ${deviceid}?`)) {
      deleteDeviceMutation.mutate(deviceid);
    }
  };

  const openEditDialog = (device: any) => {
    setSelectedDevice(device);
    setEditFormData({
      deviceid: device.device_id,
      devicename: device.device_name,
      loginname: device.gp51_metadata?.loginname || '',
      remark: device.notes || '',
      icon: device.gp51_metadata?.icon || 0,
      simnum: device.sim_number || '',
      needloctype: device.gp51_metadata?.needloctype || 7
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">GP51 Device Management</h2>
          <p className="text-gray-600 mt-1">Manage tracking devices and vehicle assignments</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Device
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New GP51 Device</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateDevice} className="space-y-4">
              <div>
                <Label htmlFor="deviceid">Device ID</Label>
                <Input
                  id="deviceid"
                  value={createFormData.deviceid || ''}
                  onChange={(e) => setCreateFormData({ ...createFormData, deviceid: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="devicename">Device Name</Label>
                <Input
                  id="devicename"
                  value={createFormData.devicename || ''}
                  onChange={(e) => setCreateFormData({ ...createFormData, devicename: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="devicetype">Device Type</Label>
                <Select 
                  value={createFormData.devicetype?.toString()} 
                  onValueChange={(value) => setCreateFormData({ ...createFormData, devicetype: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceTypes?.devicetypes?.map((type) => (
                      <SelectItem key={type.devicetypeid} value={type.devicetypeid.toString()}>
                        {type.typename}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="groupid">Group ID</Label>
                <Input
                  id="groupid"
                  type="number"
                  value={createFormData.groupid || 1}
                  onChange={(e) => setCreateFormData({ ...createFormData, groupid: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="timezone">Timezone (GMT offset)</Label>
                <Input
                  id="timezone"
                  type="number"
                  value={createFormData.timezone || 8}
                  onChange={(e) => setCreateFormData({ ...createFormData, timezone: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="calmileageway">Mileage Calculation</Label>
                <Select 
                  value={createFormData.calmileageway?.toString()} 
                  onValueChange={(value) => setCreateFormData({ ...createFormData, calmileageway: parseInt(value) as 0 | 1 | 2 })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Auto</SelectItem>
                    <SelectItem value="1">Device Collect</SelectItem>
                    <SelectItem value="2">Platform Collect</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="deviceenable"
                  checked={createFormData.deviceenable === 1}
                  onCheckedChange={(checked) => setCreateFormData({ ...createFormData, deviceenable: checked ? 1 : 0 })}
                />
                <Label htmlFor="deviceenable">Device Enabled</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="loginenable"
                  checked={createFormData.loginenable === 1}
                  onCheckedChange={(checked) => setCreateFormData({ ...createFormData, loginenable: checked ? 1 : 0 })}
                />
                <Label htmlFor="loginenable">Login Enabled</Label>
              </div>
              <Button type="submit" disabled={createDeviceMutation.isPending} className="w-full">
                {createDeviceMutation.isPending ? 'Creating...' : 'Create Device'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {devices && devices.length > 0 ? devices.map((device: any) => (
          <Card key={device.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Car className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{device.device_name}</CardTitle>
                    <div className="text-sm text-gray-500">ID: {device.device_id}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(device)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeleteDevice(device.device_id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant={device.is_active ? 'default' : 'secondary'}>
                  {device.is_active ? 'Active' : 'Inactive'}
                </Badge>
                {device.status && (
                  <Badge variant="outline">{device.status}</Badge>
                )}
              </div>
              {device.sim_number && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Smartphone className="h-3 w-3" />
                  SIM: {device.sim_number}
                </div>
              )}
              {device.gp51_username && (
                <div className="text-sm text-gray-600">
                  <strong>Owner:</strong> {device.gp51_username}
                </div>
              )}
              {device.gp51_metadata?.timezone && (
                <div className="text-sm text-gray-600">
                  <strong>Timezone:</strong> GMT+{device.gp51_metadata.timezone}
                </div>
              )}
              {device.notes && (
                <div className="text-sm text-gray-600">
                  <strong>Notes:</strong> {device.notes}
                </div>
              )}
            </CardContent>
          </Card>
        )) : (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-500 mb-4">
              No devices found. Add your first device to get started.
            </div>
          </div>
        )}
      </div>

      {/* Edit Device Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit GP51 Device</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditDevice} className="space-y-4">
            <div>
              <Label htmlFor="edit-devicename">Device Name</Label>
              <Input
                id="edit-devicename"
                value={editFormData.devicename || ''}
                onChange={(e) => setEditFormData({ ...editFormData, devicename: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-loginname">Login Name</Label>
              <Input
                id="edit-loginname"
                value={editFormData.loginname || ''}
                onChange={(e) => setEditFormData({ ...editFormData, loginname: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-simnum">SIM Number</Label>
              <Input
                id="edit-simnum"
                value={editFormData.simnum || ''}
                onChange={(e) => setEditFormData({ ...editFormData, simnum: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-remark">Remarks</Label>
              <Input
                id="edit-remark"
                value={editFormData.remark || ''}
                onChange={(e) => setEditFormData({ ...editFormData, remark: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-icon">Icon (0-16)</Label>
              <Input
                id="edit-icon"
                type="number"
                min="0"
                max="16"
                value={editFormData.icon || 0}
                onChange={(e) => setEditFormData({ ...editFormData, icon: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="edit-needloctype">Location Type</Label>
              <Select 
                value={editFormData.needloctype?.toString()} 
                onValueChange={(value) => setEditFormData({ ...editFormData, needloctype: parseInt(value) as 1 | 2 | 7 })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">GPS Only</SelectItem>
                  <SelectItem value="2">LBS Only</SelectItem>
                  <SelectItem value="7">GPS + LBS + Wifi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={editDeviceMutation.isPending} className="w-full">
              {editDeviceMutation.isPending ? 'Updating...' : 'Update Device'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GP51DeviceManagement;
