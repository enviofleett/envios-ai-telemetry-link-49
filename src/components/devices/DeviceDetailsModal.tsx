
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Cog, X } from 'lucide-react';
import DeviceOverviewTab from '@/components/devices/DeviceOverviewTab';
import DeviceConfigurationTab from '@/components/devices/DeviceConfigurationTab';
import DeviceMaintenanceTab from '@/components/devices/DeviceMaintenanceTab';
import DeviceHistoryTab from '@/components/devices/DeviceHistoryTab';

interface DeviceDetailsModalProps {
  deviceId: string;
  isOpen: boolean;
  onClose: () => void;
}

const DeviceDetailsModal: React.FC<DeviceDetailsModalProps> = ({
  deviceId,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cog className="h-5 w-5 text-gray-700" />
              <DialogTitle className="text-lg font-semibold">
                Device Configuration - {deviceId}
              </DialogTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Complete device information and configuration settings
          </p>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <DeviceOverviewTab deviceId={deviceId} />
          </TabsContent>

          <TabsContent value="configuration" className="mt-6">
            <DeviceConfigurationTab deviceId={deviceId} />
          </TabsContent>

          <TabsContent value="maintenance" className="mt-6">
            <DeviceMaintenanceTab deviceId={deviceId} />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <DeviceHistoryTab deviceId={deviceId} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceDetailsModal;
