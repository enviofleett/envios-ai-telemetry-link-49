
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DeviceStats {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  maintenanceDue: number;
  onlineRate: number;
  offlineRate: number;
}

export const useDeviceStats = () => {
  return useQuery({
    queryKey: ['device-stats'],
    queryFn: async (): Promise<DeviceStats> => {
      // Get total vehicles count
      const { count: totalDevices } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true });

      // For now, we'll simulate the device status data
      // In a real implementation, this would come from GP51 API or device status tracking
      const total = totalDevices || 0;
      const onlineDevices = Math.floor(total * 0.877); // 87.7% online rate
      const offlineDevices = total - onlineDevices;
      const maintenanceDue = Math.floor(total * 0.019); // ~1.9% need maintenance

      return {
        totalDevices: total,
        onlineDevices,
        offlineDevices,
        maintenanceDue,
        onlineRate: total > 0 ? Math.round((onlineDevices / total) * 1000) / 10 : 0,
        offlineRate: total > 0 ? Math.round((offlineDevices / total) * 1000) / 10 : 0
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};
