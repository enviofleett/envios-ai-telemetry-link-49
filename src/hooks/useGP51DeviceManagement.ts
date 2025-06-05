
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { gp51DeviceApi } from '@/services/gp51DeviceManagementApi';
import { CreateDeviceRequest, EditDeviceRequest } from '@/types/gp51-device';

export const useGP51DeviceManagement = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [createFormData, setCreateFormData] = useState<Partial<CreateDeviceRequest>>({
    deviceenable: 1,
    loginenable: 1,
    timezone: 8,
    calmileageway: 0,
    groupid: 1,
    devicetype: 1,
    creater: 'admin'
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

  return {
    devices,
    deviceTypes,
    isLoading,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    selectedDevice,
    createFormData,
    setCreateFormData,
    editFormData,
    setEditFormData,
    createDeviceMutation,
    editDeviceMutation,
    deleteDeviceMutation,
    handleCreateDevice,
    handleEditDevice,
    handleDeleteDevice,
    openEditDialog
  };
};
