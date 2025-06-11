
import { supabase } from '@/integrations/supabase/client';

// Define the type for the data as it comes directly from Supabase for the 'vehicles' table.
// This is important because 'last_position' is a JSONB column.
interface SupabaseVehicleData {
  id: string;
  device_id: string;
  device_name: string;
  status: string;
  is_active: boolean;
  last_position: {
    lat: number;
    lon: number;
    speed: number;
    updatetime: string | number;
  } | null;
}

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

// This interface describes the *expected* structure of the JSON data inside last_position,
// as it comes from the database, before any potential transformation.
interface RawVehiclePositionData {
  lat: number;
  lon: number;
  speed?: number;
  updatetime: string | number;
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
      console.log('📋 Returning cached vehicles:', this.vehicles.length);
      return { vehicles: this.vehicles, loading: false, error: null };
    }

    // Don't fetch if already loading
    if (this.loading) {
      console.log('⏳ Already loading vehicles, returning current state');
      return { vehicles: this.vehicles, loading: true, error: this.error };
    }

    try {
      this.loading = true;
      this.error = null;

      console.log('🚗 Fetching vehicles from database...');

      // Select only the fields we need for better performance
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('id, device_id, device_name, status, is_active, last_position')
        .eq('is_active', true)
        .order('device_name');

      if (error) {
        console.error('❌ Supabase query error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('📊 Raw vehicles data from DB:', vehicles?.length || 0, 'records');

      if (!vehicles || vehicles.length === 0) {
        console.log('⚠️ No vehicles found in database');
        this.vehicles = [];
      } else {
        this.vehicles = vehicles.map((vehicle, index) => {
          console.log(`🔍 Processing vehicle ${index + 1}:`, {
            id: vehicle.id,
            device_name: vehicle.device_name,
            has_position: !!vehicle.last_position,
            position_structure: vehicle.last_position ? Object.keys(vehicle.last_position) : 'null'
          });

          const processedVehicle = {
            id: vehicle.id,
            device_id: vehicle.device_id,
            device_name: vehicle.device_name,
            status: this.determineStatus(vehicle as SupabaseVehicleData),
            is_active: vehicle.is_active,
            last_position: this.parsePosition(vehicle.last_position as unknown as RawVehiclePositionData | null)
          };

          console.log(`✅ Processed vehicle ${index + 1}:`, {
            name: processedVehicle.device_name,
            status: processedVehicle.status,
            has_parsed_position: !!processedVehicle.last_position
          });

          return processedVehicle;
        });
      }

      this.lastFetch = now;
      console.log(`✅ Successfully loaded ${this.vehicles.length} vehicles from database`);

      return { vehicles: this.vehicles, loading: false, error: null };

    } catch (error) {
      console.error('❌ Failed to fetch vehicles:', error);
      this.error = error instanceof Error ? error.message : 'Failed to fetch vehicles';
      return { vehicles: this.vehicles, loading: false, error: this.error };
    } finally {
      this.loading = false;
      console.log('🏁 Vehicle fetch operation completed, loading set to false');
    }
  }

  private parsePosition(rawData: RawVehiclePositionData | null): SimpleVehicle['last_position'] {
    console.log('🔧 Parsing position data:', rawData);
    
    // Check if rawData is null, undefined, or not an object
    if (!rawData || typeof rawData !== 'object') {
      console.log('⚠️ Position data is null or not an object');
      return undefined;
    }

    // Validate essential properties
    if (rawData.lat === undefined || rawData.lon === undefined || !rawData.updatetime) {
      console.warn('⚠️ Invalid position data received, missing lat, lon, or updatetime:', rawData);
      return undefined;
    }

    // Handle different updatetime formats (timestamp number or ISO string)
    let updateTimeString: string;
    if (typeof rawData.updatetime === 'number') {
      // Convert timestamp to ISO string
      updateTimeString = new Date(rawData.updatetime * 1000).toISOString();
      console.log('🕐 Converted timestamp to ISO string:', updateTimeString);
    } else {
      updateTimeString = rawData.updatetime;
    }

    const parsedPosition = {
      lat: Number(rawData.lat),
      lon: Number(rawData.lon),
      speed: Number(rawData.speed || 0),
      updatetime: updateTimeString
    };

    console.log('✅ Parsed position successfully:', parsedPosition);
    return parsedPosition;
  }

  private determineStatus(vehicle: SupabaseVehicleData): string {
    const position = this.parsePosition(vehicle.last_position as unknown as RawVehiclePositionData | null);

    if (!position?.updatetime) {
      console.log(`📴 Vehicle ${vehicle.device_name} has no position data - marking as offline`);
      return 'offline';
    }

    const lastUpdate = new Date(position.updatetime);
    const minutesAgo = (Date.now() - lastUpdate.getTime()) / (1000 * 60);

    console.log(`⏰ Vehicle ${vehicle.device_name} last updated ${minutesAgo.toFixed(1)} minutes ago`);

    if (minutesAgo <= 5) {
      const status = position.speed > 0 ? 'moving' : 'online';
      console.log(`🟢 Vehicle ${vehicle.device_name} is ${status} (speed: ${position.speed})`);
      return status;
    } else if (minutesAgo <= 30) {
      console.log(`🟡 Vehicle ${vehicle.device_name} is idle`);
      return 'idle';
    } else {
      console.log(`🔴 Vehicle ${vehicle.device_name} is offline (last seen ${minutesAgo.toFixed(1)} min ago)`);
      return 'offline';
    }
  }

  getMetrics(): VehicleMetrics {
    const total = this.vehicles.length;
    const active = this.vehicles.filter(v => v.is_active).length;
    const online = this.vehicles.filter(v => v.status === 'online' || v.status === 'moving').length;
    const offline = this.vehicles.filter(v => v.status === 'offline').length;

    const metrics = { total, active, online, offline };
    console.log('📊 Vehicle metrics calculated:', metrics);
    return metrics;
  }

  forceRefresh(): void {
    console.log('🔄 Force refresh initiated - clearing cache');
    this.lastFetch = 0;
    this.vehicles = [];
    this.error = null;
    this.loading = false;
  }
}

export const simplifiedVehicleService = SimplifiedVehicleService.getInstance();
