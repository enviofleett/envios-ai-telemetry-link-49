
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { gp51DeviceApi } from '@/services/gp51DeviceManagementApi';
import { enhancedDeviceApi } from '@/services/enhancedDeviceManagementApi';
import { CreateDeviceRequest, EditDeviceRequest } from '@/types/gp51-device';
import { DeviceFilter } from '@/types/device-management';

export const useEnhancedDeviceManagement = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [deviceFilter, setDeviceFilter] = useState<DeviceFilter>({});
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

  // Fetch device types
  const { data: deviceTypes } = useQuery({
    queryKey: ['device-types'],
    queryFn: () => enhancedDeviceApi.getDeviceTypes(),
  });

  // Fetch device tags
  const { data: deviceTags } = useQuery({
    queryKey: ['device-tags'],
    queryFn: () => enhancedDeviceApi.getDeviceTags(),
  });

  // Fetch device groups
  const { data: deviceGroups } = useQuery({
    queryKey: ['device-groups'],
    queryFn: () => enhancedDeviceApi.getDeviceGroups(),
  });

  // Fetch devices with enhanced filtering
  const { data: allDevices, isLoading } = useQuery({
    queryKey: ['vehicles-management'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('vehicle-management');
      if (error) throw error;
      return data.vehicles;
    },
  });

  // Filter devices based on current filter
  const filteredDevices = useMemo(() => {
    if (!allDevices) return [];
    
    let filtered = allDevices;

    if (deviceFilter.search) {
      const searchTerm = deviceFilter.search.toLowerCase();
      filtered = filtered.filter((device: any) =>
        device.device_name.toLowerCase().includes(searchTerm) ||
        device.device_id.toLowerCase().includes(searchTerm)
      );
    }

    if (deviceFilter.device_type) {
      filtered = filtered.filter((device: any) =>
        device.gp51_metadata?.devicetype === deviceFilter.device_type
      );
    }

    if (deviceFilter.status) {
      filtered = filtered.filter((device: any) =>
        device.status === deviceFilter.status
      );
    }

    if (deviceFilter.is_active !== undefined) {
      filtered = filtered.filter((device: any) =>
        device.is_active === deviceFilter.is_active
      );
    }

    return filtered;
  }, [allDevices, deviceFilter]);

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

  const toggleDeviceSelection = (deviceId: string) => {
    setSelectedDevices(prev => 
      prev.includes(deviceId) 
        ? prev.filter(id => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  const toggleAllDevicesSelection = () => {
    if (selectedDevices.length === filteredDevices.length) {
      setSelectedDevices([]);
    } else {
      setSelectedDevices(filteredDevices.map((device: any) => device.device_id));
    }
  };

  const clearSelection = () => {
    setSelectedDevices([]);
  };

  return {
    // Data
    devices: filteredDevices,
    allDevices,
    deviceTypes: deviceTypes || [],
    deviceTags: deviceTags || [],
    deviceGroups: deviceGroups || [],
    isLoading,
    
    // Dialog states
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    selectedDevice,
    
    // Form data
    createFormData,
    setCreateFormData,
    editFormData,
    setEditFormData,
    
    // Mutations
    createDeviceMutation,
    editDeviceMutation,
    deleteDeviceMutation,
    
    // Handlers
    handleCreateDevice,
    handleEditDevice,
    handleDeleteDevice,
    openEditDialog,
    
    // Selection
    selectedDevices,
    toggleDeviceSelection,
    toggleAllDevicesSelection,
    clearSelection,
    
    // Filtering
    deviceFilter,
    setDeviceFilter,
  };
};
