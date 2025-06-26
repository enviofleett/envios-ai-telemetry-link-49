
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData, VehiclePosition } from '@/types/vehicle';

class EnhancedVehicleDataService {
  async loadVehicles(): Promise<VehicleData[]> {
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

      if (!vehicles || vehicles.length === 0) {
        return this.getMockVehicles();
      }

      return vehicles.map(vehicle => ({
        id: vehicle.id,
        name: vehicle.name || 'Unknown Vehicle',
        device_id: vehicle.gp51_device_id,
        gp51_device_id: vehicle.gp51_device_id, // Added missing property
        device_name: vehicle.name,
        user_id: vehicle.user_id,
        sim_number: vehicle.sim_number,
        created_at: vehicle.created_at,
        updated_at: vehicle.updated_at,
        vin: undefined,
        license_plate: undefined,
        is_active: true,
        last_position: this.getMockPosition(),
        status: 'online',
        isOnline: true,
        isMoving: Math.random() > 0.5,
        alerts: [],
        lastUpdate: new Date()
      }));
    } catch (error) {
      console.error('Failed to load vehicles:', error);
      return this.getMockVehicles();
    }
  }

  private getMockVehicles(): VehicleData[] {
    return [
      {
        id: '1',
        name: 'Fleet Vehicle 001',
        device_id: 'GP51001',
        gp51_device_id: 'GP51001', // Added missing property
        device_name: 'Fleet Vehicle 001',
        user_id: 'user1',
        sim_number: '1234567890',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        vin: 'VIN123456789',
        license_plate: 'ABC-123',
        is_active: true,
        last_position: this.getMockPosition(),
        status: 'online',
        isOnline: true,
        isMoving: true,
        alerts: [],
        lastUpdate: new Date()
      },
      {
        id: '2',
        name: 'Fleet Vehicle 002',
        device_id: 'GP51002',
        gp51_device_id: 'GP51002', // Added missing property
        device_name: 'Fleet Vehicle 002',
        user_id: 'user2',
        sim_number: '0987654321',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        vin: 'VIN987654321',
        license_plate: 'DEF-456',
        is_active: true,
        last_position: this.getMockPosition(),
        status: 'offline',
        isOnline: false,
        isMoving: false,
        alerts: [],
        lastUpdate: new Date()
      }
    ];
  }

  private getMockPosition(): VehiclePosition {
    return {
      latitude: 40.7128 + (Math.random() - 0.5) * 0.01,
      longitude: -74.0060 + (Math.random() - 0.5) * 0.01,
      speed: Math.floor(Math.random() * 80),
      course: Math.floor(Math.random() * 360),
      timestamp: new Date().toISOString()
    };
  }

  async getMockVehicleWithPosition(vehicleId: string): Promise<VehicleData | null> {
    const vehicles = await this.loadVehicles();
    const vehicle = vehicles.find(v => v.id === vehicleId);
    
    if (!vehicle) {
      return null;
    }

    return {
      ...vehicle,
      gp51_device_id: vehicle.gp51_device_id || vehicle.device_id, // Ensure property exists
      last_position: this.getMockPosition(),
      lastUpdate: new Date()
    };
  }
}

export const enhancedVehicleDataService = new EnhancedVehicleDataService();
