
import { VehicleData } from './types';
import { GP51Vehicle, GP51Position } from './gp51ApiService';

export class VehicleDataProcessor {
  /**
   * Transform database vehicles to VehicleData format
   */
  static transformDatabaseVehicles(vehicles: any[]): VehicleData[] {
    return vehicles.map(vehicle => ({
      id: vehicle.id,
      deviceId: vehicle.device_id,
      deviceName: vehicle.device_name || `Device ${vehicle.device_id}`,
      status: this.determineVehicleStatus(vehicle),
      lastPosition: vehicle.latitude && vehicle.longitude ? {
        lat: parseFloat(vehicle.latitude),
        lon: parseFloat(vehicle.longitude),
        speed: parseFloat(vehicle.speed) || 0,
        course: parseFloat(vehicle.heading) || 0,
        updatetime: vehicle.last_update || vehicle.updated_at,
        statusText: vehicle.status || 'Unknown'
      } : undefined,
      lastUpdate: new Date(vehicle.updated_at || vehicle.created_at),
      isOnline: this.isVehicleOnline(vehicle),
      metadata: {
        simNumber: vehicle.sim_number,
        notes: vehicle.notes,
        envioUserId: vehicle.envio_user_id,
        createdAt: vehicle.created_at,
        isActive: vehicle.is_active
      }
    }));
  }

  /**
   * Process GP51 vehicles with position data
   */
  static processVehicleData(
    gp51Vehicles: GP51Vehicle[], 
    positionMap: Map<string, GP51Position>
  ): VehicleData[] {
    return gp51Vehicles.map(vehicle => {
      const position = positionMap.get(vehicle.deviceid);
      
      return {
        id: vehicle.deviceid,
        deviceId: vehicle.deviceid,
        deviceName: vehicle.devicename || `Device ${vehicle.deviceid}`,
        status: this.determineStatusFromGP51(position),
        lastPosition: position ? {
          lat: position.callat,
          lon: position.callon,
          speed: position.speed,
          course: position.course,
          updatetime: position.updatetime,
          statusText: position.strstatusen
        } : undefined,
        lastUpdate: position ? new Date(position.updatetime) : new Date(),
        isOnline: this.isPositionRecent(position),
        metadata: {
          groupName: vehicle.groupname,
          gp51Status: vehicle.status
        }
      };
    });
  }

  private static determineVehicleStatus(vehicle: any): 'online' | 'offline' | 'moving' | 'idle' {
    const lastUpdate = new Date(vehicle.last_update || vehicle.updated_at);
    const minutesAgo = (Date.now() - lastUpdate.getTime()) / (1000 * 60);
    
    if (minutesAgo > 30) return 'offline';
    if (vehicle.speed > 5) return 'moving';
    if (vehicle.speed >= 0) return 'idle';
    return 'online';
  }

  private static determineStatusFromGP51(position?: GP51Position): 'online' | 'offline' | 'moving' | 'idle' {
    if (!position) return 'offline';
    
    const lastUpdate = new Date(position.updatetime);
    const minutesAgo = (Date.now() - lastUpdate.getTime()) / (1000 * 60);
    
    if (minutesAgo > 30) return 'offline';
    if (position.speed > 5) return 'moving';
    if (position.speed >= 0) return 'idle';
    return 'online';
  }

  private static isVehicleOnline(vehicle: any): boolean {
    const lastUpdate = new Date(vehicle.last_update || vehicle.updated_at);
    const minutesAgo = (Date.now() - lastUpdate.getTime()) / (1000 * 60);
    return minutesAgo <= 30;
  }

  private static isPositionRecent(position?: GP51Position): boolean {
    if (!position) return false;
    
    const lastUpdate = new Date(position.updatetime);
    const minutesAgo = (Date.now() - lastUpdate.getTime()) / (1000 * 60);
    return minutesAgo <= 30;
  }
}
