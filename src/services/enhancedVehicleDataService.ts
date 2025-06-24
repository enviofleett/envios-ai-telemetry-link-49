
import { supabase } from '@/integrations/supabase/client';

export interface VehicleData {
  id: string;
  name: string;
  device_id: string;
  device_name: string;
  user_id: string;
  sim_number?: string;
  vin?: string;
  license_plate?: string;
  is_active: boolean;
  last_position?: any;
  status: string;
  created_at: string;
  updated_at: string;
  lastUpdate: Date;
}

export interface EnhancedVehicleStats {
  totalVehicles: number;
  activeVehicles: number;
  recentlyUpdated: number;
  withIssues: number;
  averageUpdateFrequency: number;
}

export interface VehicleMetrics {
  total: number;
  online: number;
  offline: number;
  idle: number;
  alerts: number;
  totalVehicles: number;
  onlineVehicles: number;
  offlineVehicles: number;
  recentlyActiveVehicles: number;
  lastSyncTime: Date;
  positionsUpdated: number;
  errors: number;
  syncStatus: 'success' | 'error' | 'syncing';
  errorMessage?: string;
}

class EnhancedVehicleDataService {
  private subscribers: Set<(data: VehicleData[]) => void> = new Set();

  async getVehicleData(): Promise<VehicleData[]> {
    try {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return (vehicles || []).map(vehicle => ({
        id: vehicle.id,
        name: vehicle.device_name || vehicle.gp51_device_id || 'Unknown Vehicle',
        device_id: vehicle.gp51_device_id || '',
        device_name: vehicle.device_name || '',
        user_id: vehicle.user_id,
        sim_number: vehicle.sim_number,
        created_at: vehicle.created_at,
        updated_at: vehicle.updated_at,
        vin: vehicle.vin,
        license_plate: vehicle.license_plate,
        is_active: true,
        last_position: vehicle.last_position,
        status: vehicle.status || 'active',
        lastUpdate: new Date(vehicle.updated_at)
      }));
    } catch (error) {
      console.error('Error fetching vehicle data:', error);
      return [];
    }
  }

  // Synchronous methods that return the cached data
  getVehicles(): VehicleData[] {
    // Return empty array as placeholder - this should be populated by subscription
    return [];
  }

  getMetrics(): VehicleMetrics {
    return {
      total: 0,
      online: 0,
      offline: 0,
      idle: 0,
      alerts: 0,
      totalVehicles: 0,
      onlineVehicles: 0,
      offlineVehicles: 0,
      recentlyActiveVehicles: 0,
      lastSyncTime: new Date(),
      positionsUpdated: 0,
      errors: 0,
      syncStatus: 'success'
    };
  }

  async getEnhancedVehicles(): Promise<VehicleData[]> {
    return this.getVehicleData();
  }

  async getEnhancedStats(): Promise<EnhancedVehicleStats> {
    try {
      const vehicles = await this.getVehicleData();
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);
      
      const stats: EnhancedVehicleStats = {
        totalVehicles: vehicles.length,
        activeVehicles: vehicles.filter(v => v.is_active).length,
        recentlyUpdated: vehicles.filter(v => 
          new Date(v.updated_at).getTime() > oneHourAgo
        ).length,
        withIssues: vehicles.filter(v => 
          v.status === 'error' || v.status === 'offline'
        ).length,
        averageUpdateFrequency: vehicles.length > 0 ? 
          vehicles.reduce((sum, v) => {
            return sum + (now - new Date(v.updated_at).getTime());
          }, 0) / vehicles.length / (1000 * 60) : 0
      };

      return stats;
    } catch (error) {
      console.error('Error calculating enhanced stats:', error);
      return {
        totalVehicles: 0,
        activeVehicles: 0,
        recentlyUpdated: 0,
        withIssues: 0,
        averageUpdateFrequency: 0
      };
    }
  }

  async getLastSyncMetrics(): Promise<{ lastSync: Date; syncStatus: string }> {
    return {
      lastSync: new Date(),
      syncStatus: 'success'
    };
  }

  async getVehicleById(vehicleId: string): Promise<VehicleData | null> {
    try {
      const { data: vehicle, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();

      if (error) throw error;
      if (!vehicle) return null;

      return {
        id: vehicle.id,
        name: vehicle.device_name || vehicle.gp51_device_id || 'Unknown Vehicle',
        device_id: vehicle.gp51_device_id || '',
        device_name: vehicle.device_name || '',
        user_id: vehicle.user_id,
        sim_number: vehicle.sim_number,
        created_at: vehicle.created_at,
        updated_at: vehicle.updated_at,
        vin: vehicle.vin,
        license_plate: vehicle.license_plate,
        is_active: true,
        last_position: vehicle.last_position,
        status: vehicle.status || 'active',
        lastUpdate: new Date(vehicle.updated_at)
      };
    } catch (error) {
      console.error('Error fetching vehicle by ID:', error);
      return null;
    }
  }

  subscribe(callback: (data: VehicleData[]) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  async forceSync(): Promise<void> {
    console.log('Force sync initiated');
    const vehicles = await this.getVehicleData();
    this.notifySubscribers(vehicles);
  }

  private notifySubscribers(data: VehicleData[]): void {
    this.subscribers.forEach(callback => callback(data));
  }
}

export const enhancedVehicleDataService = new EnhancedVehicleDataService();
