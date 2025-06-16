
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData, VehiclePosition } from '@/types/vehicle';

class DataLoader {
  async loadFromGP51(): Promise<VehicleData[]> {
    // Mock GP51 data for now
    const mockData: VehicleData[] = [
      {
        id: '1',
        device_id: 'GP51001',
        device_name: 'Fleet Vehicle 001',
        user_id: 'user1',
        sim_number: '1234567890',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        vin: 'VIN123456789',
        license_plate: 'ABC-123',
        is_active: true,
        last_position: {
          latitude: 40.7128,
          longitude: -74.0060,
          speed: 25,
          course: 180,
          timestamp: new Date().toISOString()
        },
        status: 'online',
        isOnline: true,
        isMoving: true,
        alerts: [],
        lastUpdate: new Date()
      }
    ];

    return mockData;
  }

  async loadFromDatabase(): Promise<VehicleData[]> {
    try {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select(`
          id,
          gp51_device_id,
          name,
          sim_number,
          user_id,
          created_at,
          updated_at,
          envio_users (
            name,
            email
          )
        `);

      if (error) {
        console.error('Database query error:', error);
        throw error;
      }

      if (!vehicles) {
        return [];
      }

      // Transform to VehicleData with complete properties
      const transformedVehicles: VehicleData[] = vehicles.map(vehicle => ({
        id: vehicle.id,
        device_id: vehicle.gp51_device_id,
        device_name: vehicle.name,
        user_id: vehicle.user_id,
        sim_number: vehicle.sim_number,
        created_at: vehicle.created_at,
        updated_at: vehicle.updated_at,
        envio_users: vehicle.envio_users,
        status: 'offline',
        is_active: true,
        last_position: undefined,
        isOnline: false,
        isMoving: false,
        alerts: [],
        lastUpdate: new Date(vehicle.updated_at)
      }));

      return transformedVehicles;
    } catch (error) {
      console.error('Failed to load from database:', error);
      throw error;
    }
  }
}

export const dataLoader = new DataLoader();
