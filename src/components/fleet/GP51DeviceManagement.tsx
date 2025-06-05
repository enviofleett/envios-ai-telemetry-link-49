
import React, { useState } from 'react';
import { Plus, Filter, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEnhancedDeviceManagement } from '@/hooks/useEnhancedDeviceManagement';
import { useQuery } from '@tanstack/react-query';
import { gp51DeviceApi } from '@/services/gp51DeviceManagementApi';
import GP51CreateDeviceForm from './GP51CreateDeviceForm';
import GP51EditDeviceForm from './GP51EditDeviceForm';
import GP51DeviceCard from './GP51DeviceCard';
import DeviceTypeManagement from './DeviceTypeManagement';
import DeviceFilters from './DeviceFilters';
import BulkDeviceOperations from './BulkDeviceOperations';

const GP51DeviceManagement = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Fetch GP51 device types directly for the form components
  const { data: gp51DeviceTypes } = useQuery({
    queryKey: ['gp51-device-types'],
    queryFn: () => gp51DeviceApi.queryDeviceTypes(),
  });
  
  const {
    devices,
    deviceTypes: enhancedDeviceTypes,
    deviceTags,
    isLoading,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    createFormData,
    setCreateFormData,
    editFormData,
    setEditFormData,
    createDeviceMutation,
    editDeviceMutation,
    handleCreateDevice,
    handleEditDevice,
    handleDeleteDevice,
    openEditDialog,
    selectedDevices,
    toggleDeviceSelection,
    toggleAllDevicesSelection,
    clearSelection,
    deviceFilter,
    setDeviceFilter
  } = useEnhancedDeviceManagement();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Device Management</h2>
          <p className="text-gray-600 mt-1">Manage tracking devices and vehicle assignments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
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
              <GP51CreateDeviceForm
                formData={createFormData}
                onFormDataChange={setCreateFormData}
                onSubmit={handleCreateDevice}
                deviceTypes={gp51DeviceTypes?.devicetypes || []}
                isPending={createDeviceMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="devices" className="space-y-6">
        <TabsList>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="device-types">Device Types</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-6">
          {/* Filters */}
          {showFilters && (
            <DeviceFilters
              filter={deviceFilter}
              onFilterChange={setDeviceFilter}
              deviceTypes={enhancedDeviceTypes}
              deviceTags={deviceTags}
              onToggleCollapse={() => setShowFilters(false)}
            />
          )}

          {/* View Controls */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {devices?.length || 0} devices
                {selectedDevices.length > 0 && ` (${selectedDevices.length} selected)`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Device List */}
          <div className={viewMode === 'grid' ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
            {devices && devices.length > 0 ? devices.map((device: any) => (
              <GP51DeviceCard
                key={device.id}
                device={device}
                onEdit={openEditDialog}
                onDelete={handleDeleteDevice}
                isSelected={selectedDevices.includes(device.device_id)}
                onSelect={() => toggleDeviceSelection(device.device_id)}
                viewMode={viewMode}
              />
            )) : (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-500 mb-4">
                  No devices found. Add your first device to get started.
                </div>
              </div>
            )}
          </div>

          {/* Bulk Operations */}
          <BulkDeviceOperations
            selectedDevices={selectedDevices}
            onClearSelection={clearSelection}
            deviceTags={deviceTags}
          />
        </TabsContent>

        <TabsContent value="device-types">
          <DeviceTypeManagement />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit GP51 Device</DialogTitle>
          </DialogHeader>
          <GP51EditDeviceForm
            formData={editFormData}
            onFormDataChange={setEditFormData}
            onSubmit={handleEditDevice}
            isPending={editDeviceMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GP51DeviceManagement;
