
import { VehicleData } from './types';

export class VehicleDataProcessor {
  static transformDatabaseVehicles(dbVehicles: any[]): VehicleData[] {
    return dbVehicles.map(vehicle => this.transformDatabaseVehicle(vehicle));
  }

  static transformDatabaseVehicle(dbVehicle: any): VehicleData {
    const lastPosition = dbVehicle.last_position;
    
    // Determine vehicle status based on last position update
    let status: 'online' | 'offline' | 'unknown' = 'offline';
    let lastUpdate = new Date();
    
    if (lastPosition?.updatetime) {
      lastUpdate = new Date(lastPosition.updatetime);
      const minutesSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60);
      
      if (minutesSinceUpdate <= 5) {
        // Map moving vehicles to 'online' status since 'moving' isn't allowed in VehicleData type
        status = 'online';
      } else if (minutesSinceUpdate <= 30) {
        // Map idle vehicles to 'online' status as well
        status = 'online';
      } else {
        status = 'offline';
      }
    }

    return {
      deviceId: dbVehicle.device_id,
      deviceName: dbVehicle.device_name,
      status,
      lastUpdate,
      location: lastPosition ? {
        latitude: lastPosition.lat || 0,
        longitude: lastPosition.lon || 0,
      } : undefined,
      speed: lastPosition?.speed || 0,
      course: lastPosition?.course || 0,
      additionalData: {
        plateNumber: dbVehicle.device_name,
        isActive: dbVehicle.is_active || true,
        position: lastPosition ? {
          lat: lastPosition.lat || 0,
          lng: lastPosition.lon || 0,
          speed: lastPosition.speed || 0,
          course: lastPosition.course || 0,
          timestamp: lastPosition.updatetime || new Date().toISOString()
        } : undefined
      }
    };
  }

  static processVehicleData(gp51Vehicles: any[], positionMap: Map<number, any>): VehicleData[] {
    return gp51Vehicles.map(vehicle => {
      const position = positionMap.get(vehicle.deviceid);
      const lastUpdate = position?.updatetime ? new Date(position.updatetime) : new Date();
      
      let status: 'online' | 'offline' | 'unknown' = 'offline';
      if (position) {
        const minutesSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60);
        if (minutesSinceUpdate <= 5) {
          status = 'online';
        } else if (minutesSinceUpdate <= 30) {
          status = 'online';
        } else {
          status = 'offline';
        }
      }

      return {
        deviceId: vehicle.deviceid?.toString() || '',
        deviceName: vehicle.devicename || 'Unknown Device',
        status,
        lastUpdate,
        location: position ? {
          latitude: position.callat || position.lat || 0,
          longitude: position.callon || position.lon || 0,
        } : undefined,
        speed: position?.speed || 0,
        course: position?.course || 0,
        additionalData: {
          plateNumber: vehicle.devicename || 'Unknown',
          isActive: true,
          position: position ? {
            lat: position.callat || position.lat || 0,
            lng: position.callon || position.lon || 0,
            speed: position.speed || 0,
            course: position.course || 0,
            timestamp: position.updatetime || new Date().toISOString()
          } : undefined
        }
      };
    });
  }
}
