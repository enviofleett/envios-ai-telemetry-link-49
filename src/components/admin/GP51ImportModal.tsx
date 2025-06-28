import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast"
import { useProductionGP51Service } from '@/hooks/useProductionGP51Service';
import { gp51DataService } from '@/services/gp51/GP51DataService';
import type { GP51DeviceData, GP51Device } from '@/types/gp51-unified';
import { convertGP51DeviceToDeviceData } from '@/types/gp51-unified';

interface GP51ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Transform GP51Device to GP51DeviceData for compatibility
const transformDeviceData = (device: GP51Device): GP51DeviceData => ({
  deviceid: device.deviceid,
  devicename: device.devicename,
  devicetype: typeof device.devicetype === 'string' ? parseInt(device.devicetype) || 0 : (device.devicetype || 0),
  isfree: device.isfree || 0,
  lastactivetime: typeof device.lastactivetime === 'string' 
    ? new Date(device.lastactivetime).getTime() 
    : (device.lastactivetime || 0),
  lastUpdate: device.lastactivetime 
    ? (typeof device.lastactivetime === 'string' 
        ? device.lastactivetime 
        : new Date(device.lastactivetime).toISOString())
    : new Date().toISOString(),
  simnum: device.simnum || device.simcardno,
  groupid: typeof device.groupid === 'string' ? parseInt(device.groupid) || 0 : device.groupid,
  groupname: device.groupname,
  status: device.isfree === 1 ? 'active' : 'inactive',
  online: Boolean(device.isOnline || device.isActive)
});

const GP51ImportModal: React.FC<GP51ImportModalProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { syncDevices } = useProductionGP51Service();

  const processDevices = async (devices: GP51Device[]) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log(`🔄 Processing ${devices.length} devices...`);
      
      // Fix: Ensure all required properties are present
      const transformedDevices = devices.map(device => ({
        deviceid: device.deviceid,
        devicename: device.devicename,
        devicetype: device.devicetype || 0,
        isfree: device.isfree,
        lastactivetime: device.lastactivetime || Date.now(), // Ensure required property
        lastUpdate: device.lastactivetime ? 
          new Date(device.lastactivetime).toISOString() : 
          new Date().toISOString(),
        simnum: device.simnum,
        groupid: device.groupid,
        groupname: device.groupname,
        status: device.isfree === 1 ? 'active' : 'inactive',
        online: Boolean(device.lastactivetime && (Date.now() - device.lastactivetime) < 300000),
        remark: device.remark,
        creater: device.creater,
        videochannelcount: device.videochannelcount,
        allowedit: device.allowedit,
        icon: device.icon,
        stared: device.stared,
        loginame: device.loginame
      }));
      
      const result = await syncDevices(transformedDevices);

      if (result.success) {
        toast({
          title: "Import Successful",
          description: `Successfully imported ${result.created} devices. ${result.errors} errors.`,
        });
      } else {
        setError('Import failed');
        toast({
          title: "Import Failed",
          description: 'Import failed',
          variant: "destructive",
        });
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Import failed');
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : 'Import failed',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  const handleImport = async () => {
    try {
      setIsLoading(true);
      const response = await gp51DataService.getLiveVehicles();
      
      // Handle different response structures
      let devices: GP51Device[] = [];
      if (Array.isArray(response)) {
        devices = response;
      } else if (response && 'vehicles' in response && Array.isArray(response.vehicles)) {
        devices = response.vehicles;
      } else if (response && 'data' in response && Array.isArray(response.data)) {
        devices = response.data;
      }
      
      if (devices.length > 0) {
        await processDevices(devices);
      } else {
        setError('No devices found to import');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import GP51 Devices</DialogTitle>
          <DialogDescription>
            Import devices directly from GP51. This will sync device data
            with your local database.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && (
            <div className="text-red-500">Error: {error}</div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={handleImport} 
            disabled={isLoading}
          >
            {isLoading ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GP51ImportModal;
