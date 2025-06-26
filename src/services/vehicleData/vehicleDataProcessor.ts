
import type { VehicleData } from '@/types/vehicle';

export function processVehicleData(rawData: any): VehicleData {
  return {
    id: rawData.id,
    name: rawData.name,
    device_id: rawData.device_id,
    gp51_device_id: rawData.gp51_device_id || rawData.device_id, // Added missing property
    device_name: rawData.device_name,
    user_id: rawData.user_id,
    sim_number: rawData.sim_number,
    created_at: rawData.created_at,
    updated_at: rawData.updated_at,
    status: rawData.status || 'offline',
    is_active: rawData.is_active,
    last_position: rawData.last_position,
    isOnline: rawData.isOnline,
    isMoving: rawData.isMoving,
    alerts: rawData.alerts,
    lastUpdate: new Date()
  };
}

export function processVehicleList(rawDataList: any[]): VehicleData[] {
  return rawDataList.map(processVehicleData);
}
