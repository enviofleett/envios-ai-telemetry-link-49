
import { VehicleData, GP51Vehicle, GP51Position } from './types';

export class VehicleDataProcessor {
  static processVehicleData(
    gp51Vehicles: GP51Vehicle[], 
    positionMap: Map<number, GP51Position>
  ): VehicleData[] {
    return gp51Vehicles.map((vehicle: GP51Vehicle) => {
      const position = positionMap.get(vehicle.deviceid);
      const lastUpdate = position?.servertime ? new Date(position.servertime * 1000) : new Date();
      const timeSinceUpdate = Date.now() - lastUpdate.getTime();
      
      return {
        deviceId: vehicle.deviceid.toString(),
        deviceName: vehicle.devicename || `Vehicle ${vehicle.deviceid}`,
        status: this.determineVehicleStatus(timeSinceUpdate, position),
        lastUpdate,
        location: position ? {
          latitude: position.lat,
          longitude: position.lng
        } : undefined,
        speed: position?.speed || 0,
        course: position?.course || 0,
        additionalData: {
          ...vehicle,
          position: position || null
        }
      };
    });
  }

  static determineVehicleStatus(timeSinceUpdate: number, position?: GP51Position): 'online' | 'offline' | 'unknown' {
    if (!position) return 'unknown';
    
    // Consider vehicle online if updated within last 15 minutes
    if (timeSinceUpdate <= 15 * 60 * 1000) {
      return 'online';
    }
    
    // Consider offline if no update for more than 2 hours
    if (timeSinceUpdate > 2 * 60 * 60 * 1000) {
      return 'offline';
    }
    
    return 'unknown';
  }

  static transformDatabaseVehicles(vehicles: any[]): VehicleData[] {
    return vehicles.map(vehicle => ({
      deviceId: vehicle.device_id,
      deviceName: vehicle.device_name || `Vehicle ${vehicle.device_id}`,
      status: 'unknown' as const,
      lastUpdate: new Date(vehicle.updated_at || vehicle.created_at),
      additionalData: (vehicle.gp51_metadata as Record<string, any>) || {}
    }));
  }
}
