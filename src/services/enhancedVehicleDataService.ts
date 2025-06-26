
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData, VehiclePosition, VehicleDataMetrics } from '@/types/vehicle';

class EnhancedVehicleDataService {
  private vehicles: VehicleData[] = [];
  private subscribers: (() => void)[] = [];

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

      this.vehicles = vehicles.map(vehicle => ({
        id: vehicle.id,
        name: vehicle.name || 'Unknown Vehicle',
        device_id: vehicle.gp51_device_id,
        gp51_device_id: vehicle.gp51_device_id,
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
      
      return this.vehicles;
    } catch (error) {
      console.error('Failed to load vehicles:', error);
      return this.getMockVehicles();
    }
  }

  async getVehicleData(): Promise<VehicleData[]> {
    return this.loadVehicles();
  }

  async getEnhancedVehicles(): Promise<VehicleData[]> {
    return this.loadVehicles();
  }

  getMetrics(): VehicleDataMetrics {
    const total = this.vehicles.length;
    const online = this.vehicles.filter(v => v.status === 'online').length;
    const offline = this.vehicles.filter(v => v.status === 'offline').length;
    const idle = this.vehicles.filter(v => v.status === 'idle').length;
    const alerts = this.vehicles.filter(v => v.alerts && v.alerts.length > 0).length;

    return {
      total,
      online,
      offline,
      idle,
      alerts,
      totalVehicles: total,
      onlineVehicles: online,
      offlineVehicles: offline,
      recentlyActiveVehicles: online + idle,
      lastSyncTime: new Date(),
      positionsUpdated: total,
      errors: 0,
      syncStatus: 'success'
    };
  }

  async getLastSyncMetrics(): Promise<{
    positionsUpdated: number;
    errors: number;
    syncStatus: 'success' | 'error' | 'syncing';
    errorMessage?: string;
  }> {
    return {
      positionsUpdated: this.vehicles.length,
      errors: 0,
      syncStatus: 'success'
    };
  }

  subscribe(callback: () => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback());
  }

  async forceSync(): Promise<void> {
    await this.loadVehicles();
    this.notifySubscribers();
  }

  getVehicleById(deviceId: string): VehicleData | undefined {
    return this.vehicles.find(v => v.device_id === deviceId);
  }

  private getMockVehicles(): VehicleData[] {
    return [
      {
        id: '1',
        name: 'Fleet Vehicle 001',
        device_id: 'GP51001',
        gp51_device_id: 'GP51001',
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
        gp51_device_id: 'GP51002',
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
      gp51_device_id: vehicle.gp51_device_id || vehicle.device_id,
      last_position: this.getMockPosition(),
      lastUpdate: new Date()
    };
  }
}

export const enhancedVehicleDataService = new EnhancedVehicleDataService();
