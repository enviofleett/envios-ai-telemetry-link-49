
import { VehicleData } from './types';

export class VehicleDataProcessor {
  static transformDatabaseVehicles(dbVehicles: any[]): VehicleData[] {
    return dbVehicles.map(vehicle => this.transformDatabaseVehicle(vehicle));
  }

  static transformDatabaseVehicle(dbVehicle: any): VehicleData {
    const lastPosition = dbVehicle.last_position;
    
    // Determine vehicle status based on last position update
    let status: 'online' | 'offline' | 'moving' | 'idle' = 'offline';
    let lastUpdate = new Date();
    
    if (lastPosition?.updatetime) {
      lastUpdate = new Date(lastPosition.updatetime);
      const minutesSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60);
      
      if (minutesSinceUpdate <= 5) {
        status = lastPosition.speed > 0 ? 'moving' : 'online';
      } else if (minutesSinceUpdate <= 30) {
        status = 'idle';
      }
    }

    return {
      deviceId: dbVehicle.device_id,
      deviceName: dbVehicle.device_name,
      plateNumber: dbVehicle.device_name,
      status,
      lastUpdate,
      position: lastPosition ? {
        lat: lastPosition.lat || 0,
        lng: lastPosition.lon || 0,
        speed: lastPosition.speed || 0,
        course: lastPosition.course || 0,
        timestamp: lastPosition.updatetime || new Date().toISOString()
      } : undefined,
      isActive: dbVehicle.is_active || true
    };
  }

  static processVehicleData(gp51Vehicles: any[], positionMap: Map<number, any>): VehicleData[] {
    return gp51Vehicles.map(vehicle => {
      const position = positionMap.get(vehicle.deviceid);
      const lastUpdate = position?.updatetime ? new Date(position.updatetime) : new Date();
      
      let status: 'online' | 'offline' | 'moving' | 'idle' = 'offline';
      if (position) {
        const minutesSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60);
        if (minutesSinceUpdate <= 5) {
          status = position.speed > 0 ? 'moving' : 'online';
        } else if (minutesSinceUpdate <= 30) {
          status = 'idle';
        }
      }

      return {
        deviceId: vehicle.deviceid?.toString() || '',
        deviceName: vehicle.devicename || 'Unknown Device',
        plateNumber: vehicle.devicename || 'Unknown',
        status,
        lastUpdate,
        position: position ? {
          lat: position.callat || position.lat || 0,
          lng: position.callon || position.lon || 0,
          speed: position.speed || 0,
          course: position.course || 0,
          timestamp: position.updatetime || new Date().toISOString()
        } : undefined,
        isActive: true
      };
    });
  }
}
