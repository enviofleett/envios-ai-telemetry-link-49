
import { useQuery } from '@tanstack/react-query';
import { gp51DataService } from '@/services/gp51/GP51DataService';
import type { VehicleData, VehicleDataMetrics } from '@/types/vehicle';
import type { GP51Device, GP51ProcessedPosition } from '@/types/gp51';

const transformToVehicleData = (devices: GP51Device[], positions: Map<string, GP51ProcessedPosition>): VehicleData[] => {
    return devices.map(device => {
        const position = positions.get(device.deviceId);
        const lastUpdate = position?.timestamp ? new Date(position.timestamp) : (device.lastUpdate || new Date(0));
        const isOnline = position?.isOnline ?? device.isOnline ?? false;
        
        const vehicle: VehicleData = {
          id: device.deviceId,
          device_id: device.deviceId,
          device_name: device.deviceName,
          is_active: true,
          last_position: position ? {
            latitude: position.latitude,
            longitude: position.longitude,
            speed: position.speed,
            course: position.course,
            timestamp: position.timestamp.toISOString()
          } : undefined,
          status: isOnline ? 'online' : 'offline',
          lastUpdate: lastUpdate,
          isOnline: isOnline,
          isMoving: position ? position.speed > 0 : false,
        };
        return vehicle;
    });
};

const calculateMetrics = (vehicles: VehicleData[], error?: Error): VehicleDataMetrics => {
    const online = vehicles.filter(v => v.isOnline).length;
    const offline = vehicles.length - online;
    return {
      total: vehicles.length,
      online: online,
      offline: offline,
      idle: 0,
      alerts: 0,
      totalVehicles: vehicles.length,
      onlineVehicles: online,
      offlineVehicles: offline,
      recentlyActiveVehicles: 0,
      lastSyncTime: new Date(),
      positionsUpdated: vehicles.length,
      errors: error ? 1 : 0,
      syncStatus: error ? 'error' : 'success',
      errorMessage: error?.message,
    };
};

export const useSimpleVehicleData = () => {
    return useQuery<{ vehicles: VehicleData[], metrics: VehicleDataMetrics }, Error>({
        queryKey: ['simple-vehicle-data'],
        queryFn: async () => {
            console.log('🔄 Fetching simple vehicle data...');
            const deviceListResult = await gp51DataService.getDeviceList();
            if (!deviceListResult.success || !deviceListResult.data) {
                throw new Error(deviceListResult.error || 'Failed to fetch device list');
            }

            const devices = deviceListResult.data;
            if (devices.length === 0) {
                return { vehicles: [], metrics: calculateMetrics([]) };
            }

            const deviceIds = devices.map(d => d.deviceId);
            const positionsMap = await gp51DataService.getMultipleDevicesLastPositions(deviceIds);

            const vehicles = transformToVehicleData(devices, positionsMap);
            const metrics = calculateMetrics(vehicles);

            console.log(`✅ Successfully fetched ${vehicles.length} vehicles.`);
            return { vehicles, metrics };
        },
        refetchInterval: 30000,
        staleTime: 15000,
    });
};
