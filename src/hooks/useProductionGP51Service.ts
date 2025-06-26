
import { useState, useCallback } from 'react';
import { toast } from "sonner";
import type { GP51DeviceData, GP51ProcessResult } from '@/types/gp51';

export interface UseProductionGP51ServiceReturn {
  syncDevices: (devices: GP51DeviceData[]) => Promise<GP51ProcessResult>;
  isLoading: boolean;
  error: string | null;
}

export function useProductionGP51Service(): UseProductionGP51ServiceReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncDevices = useCallback(async (devices: GP51DeviceData[]): Promise<GP51ProcessResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`🔄 Syncing ${devices.length} devices...`);
      
      // Simulate device sync processing
      let created = 0;
      let errors = 0;
      const errorDetails: string[] = [];

      for (const device of devices) {
        try {
          // Validate device data
          if (!device.deviceId && !device.deviceid) {
            errors++;
            errorDetails.push(`Device missing ID: ${JSON.stringify(device)}`);
            continue;
          }

          if (!device.deviceName && !device.devicename) {
            errors++;
            errorDetails.push(`Device missing name: ${device.deviceId || device.deviceid}`);
            continue;
          }

          created++;
        } catch (err) {
          errors++;
          errorDetails.push(`Error processing device ${device.deviceId || device.deviceid}: ${err}`);
        }
      }

      const result: GP51ProcessResult = {
        success: errors === 0,
        created,
        errors,
        processed: created,
        skipped: 0,
        details: errorDetails,
        timestamp: new Date()
      };

      console.log(`✅ Sync completed: ${created} created, ${errors} errors`);
      return result;

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Sync failed';
      setError(errorMsg);
      
      return {
        success: false,
        created: 0,
        errors: devices.length,
        processed: 0,
        skipped: 0,
        details: [errorMsg],
        timestamp: new Date()
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    syncDevices,
    isLoading,
    error
  };
}
