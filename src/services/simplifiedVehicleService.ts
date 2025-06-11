
import { supabase } from '@/integrations/supabase/client';

export interface SimpleVehicle {
  id: string;
  device_id: string;
  device_name: string;
  status: string;
  is_active: boolean;
  last_position?: {
    lat: number;
    lon: number;
    speed: number;
    updatetime: string;
  };
}

export interface VehicleMetrics {
  total: number;
  active: number;
  online: number;
  offline: number;
}

class SimplifiedVehicleService {
  private static instance: SimplifiedVehicleService;
  private vehicles: SimpleVehicle[] = [];
  private loading = false;
  private error: string | null = null;
  private lastFetch = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  static getInstance(): SimplifiedVehicleService {
    if (!SimplifiedVehicleService.instance) {
      SimplifiedVehicleService.instance = new SimplifiedVehicleService();
    }
    return SimplifiedVehicleService.instance;
  }

  async getVehicles(): Promise<{ vehicles: SimpleVehicle[]; loading: boolean; error: string | null }> {
    const now = Date.now();
    
    // Return cached data if recent
    if (this.vehicles.length > 0 && (now - this.lastFetch) < this.CACHE_DURATION) {
      return { vehicles: this.vehicles, loading: false, error: null };
    }

    // Don't fetch if already loading
    if (this.loading) {
      return { vehicles: this.vehicles, loading: true, error: this.error };
    }

    try {
      this.loading = true;
      this.error = null;

      console.log('🚗 Fetching vehicles from database...');
      
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('is_active', true)
        .order('device_name');

      if (error) {
        throw new Error(error.message);
      }

      this.vehicles = (vehicles || []).map(vehicle => ({
        id: vehicle.id,
        device_id: vehicle.device_id,
        device_name: vehicle.device_name,
        status: this.determineStatus(vehicle),
        is_active: vehicle.is_active,
        last_position: vehicle.last_position ? {
          lat: vehicle.last_position.lat,
          lon: vehicle.last_position.lon,
          speed: vehicle.last_position.speed || 0,
          updatetime: vehicle.last_position.updatetime
        } : undefined
      }));

      this.lastFetch = now;
      console.log(`✅ Loaded ${this.vehicles.length} vehicles from database`);

      return { vehicles: this.vehicles, loading: false, error: null };

    } catch (error) {
      console.error('❌ Failed to fetch vehicles:', error);
      this.error = error instanceof Error ? error.message : 'Failed to fetch vehicles';
      return { vehicles: this.vehicles, loading: false, error: this.error };
    } finally {
      this.loading = false;
    }
  }

  private determineStatus(vehicle: any): string {
    if (!vehicle.last_position?.updatetime) {
      return 'offline';
    }

    const lastUpdate = new Date(vehicle.last_position.updatetime);
    const minutesAgo = (Date.now() - lastUpdate.getTime()) / (1000 * 60);

    if (minutesAgo <= 5) {
      return vehicle.last_position.speed > 0 ? 'moving' : 'online';
    } else if (minutesAgo <= 30) {
      return 'idle';
    } else {
      return 'offline';
    }
  }

  getMetrics(): VehicleMetrics {
    const total = this.vehicles.length;
    const active = this.vehicles.filter(v => v.is_active).length;
    const online = this.vehicles.filter(v => v.status === 'online' || v.status === 'moving').length;
    const offline = this.vehicles.filter(v => v.status === 'offline').length;

    return { total, active, online, offline };
  }

  forceRefresh(): void {
    this.lastFetch = 0;
    this.vehicles = [];
    this.error = null;
  }
}

export const simplifiedVehicleService = SimplifiedVehicleService.getInstance();
