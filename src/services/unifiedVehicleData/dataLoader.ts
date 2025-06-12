
import { VehicleData, VehiclePosition } from '@/types/vehicle';

export class VehicleDataLoader {
  private static transformGP51Position(rawPosition: any): VehiclePosition {
    return {
      lat: rawPosition.lat,
      lon: rawPosition.lng || rawPosition.lon, // Handle both lng and lon
      speed: rawPosition.speed || 0,
      course: rawPosition.course || 0,
      timestamp: new Date(rawPosition.updatetime || Date.now()),
      statusText: rawPosition.statusText || 'Unknown'
    };
  }

  private static transformSupabaseVehicle(supabaseRecord: any): VehicleData {
    let lastPosition: VehiclePosition | undefined;
    
    // Handle position data transformation
    if (supabaseRecord.last_position) {
      const rawPosition = supabaseRecord.last_position;
      lastPosition = {
        lat: rawPosition.lat,
        lon: rawPosition.lng || rawPosition.lon,
        speed: rawPosition.speed || 0,
        course: rawPosition.course || 0,
        timestamp: new Date(rawPosition.updatetime || rawPosition.timestamp || Date.now()),
        statusText: rawPosition.statusText || 'Unknown'
      };
    }

    return {
      id: supabaseRecord.id,
      deviceId: supabaseRecord.device_id,
      deviceName: supabaseRecord.device_name || 'Unknown Device',
      vehicleName: supabaseRecord.device_name,
      status: supabaseRecord.is_active ? 'online' : 'offline',
      lastUpdate: lastPosition ? lastPosition.timestamp : new Date(supabaseRecord.updated_at || supabaseRecord.created_at),
      alerts: [],
      isOnline: supabaseRecord.is_active || false,
      isMoving: lastPosition ? lastPosition.speed > 0 : false,
      speed: lastPosition ? lastPosition.speed : 0,
      course: lastPosition ? lastPosition.course : 0,
      is_active: supabaseRecord.is_active || false,
      envio_user_id: supabaseRecord.envio_user_id,
      lastPosition: lastPosition
    };
  }

  static async loadFromSupabase(): Promise<VehicleData[]> {
    // Implementation would go here
    return [];
  }

  static async loadFromGP51(): Promise<VehicleData[]> {
    // Implementation would go here
    return [];
  }

  static transformPositionData(rawData: any): VehiclePosition {
    return {
      lat: rawData.lat,
      lon: rawData.lng || rawData.lon,
      speed: rawData.speed || 0,
      course: rawData.course || 0,
      timestamp: new Date(rawData.updatetime || rawData.timestamp || Date.now()),
      statusText: rawData.statusText || 'Unknown'
    };
  }
}
