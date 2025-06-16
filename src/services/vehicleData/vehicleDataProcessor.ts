
import type { VehicleData } from '@/types/vehicle';
import type { VehicleStatus } from './types';

export class VehicleDataProcessor {
  static processVehicleData(rawData: any[]): VehicleData[] {
    return rawData.map(item => this.transformToVehicleData(item));
  }

  static transformToVehicleData(rawVehicle: any): VehicleData {
    return {
      id: rawVehicle.id || rawVehicle.deviceId,
      device_id: rawVehicle.device_id || rawVehicle.deviceId,
      device_name: rawVehicle.device_name || rawVehicle.name,
      user_id: rawVehicle.user_id || null,
      sim_number: rawVehicle.sim_number || null,
      created_at: rawVehicle.created_at || new Date().toISOString(),
      updated_at: rawVehicle.updated_at || new Date().toISOString(),
      status: this.determineStatus(rawVehicle),
      is_active: rawVehicle.is_active !== undefined ? rawVehicle.is_active : true,
      last_position: rawVehicle.last_position,
      isOnline: rawVehicle.isOnline || false,
      isMoving: rawVehicle.isMoving || false,
      alerts: rawVehicle.alerts || [],
      lastUpdate: rawVehicle.lastUpdate ? new Date(rawVehicle.lastUpdate) : new Date()
    };
  }

  private static determineStatus(vehicle: any): 'online' | 'offline' | 'idle' | 'moving' {
    if (vehicle.isOnline) {
      return vehicle.isMoving ? 'moving' : 'idle';
    }
    return 'offline';
  }
}
