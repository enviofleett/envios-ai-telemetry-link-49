
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useGP51DeviceManagement } from '@/hooks/useGP51DeviceManagement';
import GP51CreateDeviceForm from './GP51CreateDeviceForm';
import GP51EditDeviceForm from './GP51EditDeviceForm';
import GP51DeviceCard from './GP51DeviceCard';

const GP51DeviceManagement = () => {
  const {
    devices,
    deviceTypes,
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
    openEditDialog
  } = useGP51DeviceManagement();

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
            <GP51CreateDeviceForm
              formData={createFormData}
              onFormDataChange={setCreateFormData}
              onSubmit={handleCreateDevice}
              deviceTypes={deviceTypes?.devicetypes}
              isPending={createDeviceMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {devices && devices.length > 0 ? devices.map((device: any) => (
          <GP51DeviceCard
            key={device.id}
            device={device}
            onEdit={openEditDialog}
            onDelete={handleDeleteDevice}
          />
        )) : (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-500 mb-4">
              No devices found. Add your first device to get started.
            </div>
          </div>
        )}
      </div>

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
