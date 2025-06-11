
import { supabase } from '@/integrations/supabase/client';

// Define the type for the data as it comes directly from Supabase for the 'vehicles' table.
// This is important because 'last_position' is a JSONB column.
interface SupabaseVehicleData {
  id: string;
  device_id: string;
  device_name: string;
  status: string; // Assuming status comes directly as a string or needs to be determined
  is_active: boolean;
  // Supabase JSONB column will be typed as 'any' or 'Json' by default.
  // We'll explicitly type it as the expected raw JSON structure.
  last_position: {
    lat: number;
    lon: number;
    speed: number;
    updatetime: string;
  } | null; // It can also be null if there's no position data
  // Add any other columns you are selecting from the 'vehicles' table here
  // For example:
  // created_at: string;
  // user_id: string;
}

export interface SimpleVehicle {
  id: string;
  device_id: string;
  device_name: string;
  status: string;
  is_active: boolean;
  last_position?: { // This is now optional as per your original interface
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
  speed?: number; // Speed might be optional in the raw data
  updatetime: string;
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

      // Explicitly type the data returned by Supabase
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('is_active', true)
        .order('device_name') as { data: SupabaseVehicleData[] | null; error: any }; // Cast the entire result

      if (error) {
        throw new Error(error.message);
      }

      this.vehicles = (vehicles || []).map(vehicle => ({
        id: vehicle.id,
        device_id: vehicle.device_id,
        device_name: vehicle.device_name,
        // The 'status' field in your SupabaseVehicleData might differ from your SimpleVehicle status.
        // Assuming 'determineStatus' handles the transformation from raw vehicle data.
        status: this.determineStatus(vehicle), // vehicle as SupabaseVehicleData to ensure type safety
        is_active: vehicle.is_active,
        // Cast vehicle.last_position to RawVehiclePositionData | null
        last_position: this.parsePosition(vehicle.last_position as RawVehiclePositionData | null)
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

  // Renamed 'position' parameter to 'rawData' to make it clear it's the raw JSON data
  private parsePosition(rawData: RawVehiclePositionData | null): SimpleVehicle['last_position'] {
    // Check if rawData is null, undefined, or not an object
    if (!rawData || typeof rawData !== 'object') {
      return undefined;
    }

    // Now, we are confident `rawData` is an object, but we still need to validate its contents
    // No explicit cast needed here if rawData is already typed as RawVehiclePositionData
    // const positionData = rawData; // No need for this line

    // Validate essential properties
    if (!rawData.lat || !rawData.lon || !rawData.updatetime) {
      console.warn('Invalid position data received, missing lat, lon, or updatetime:', rawData);
      return undefined;
    }

    return {
      lat: Number(rawData.lat),
      lon: Number(rawData.lon),
      speed: Number(rawData.speed || 0), // Default to 0 if speed is missing
      updatetime: rawData.updatetime
    };
  }

  // Ensure `determineStatus` receives a type that includes `last_position` as Supabase provides it.
  private determineStatus(vehicle: SupabaseVehicleData): string {
    // Pass the raw last_position data to parsePosition
    const position = this.parsePosition(vehicle.last_position as RawVehiclePositionData | null);

    if (!position?.updatetime) {
      return 'offline';
    }

    const lastUpdate = new Date(position.updatetime);
    const minutesAgo = (Date.now() - lastUpdate.getTime()) / (1000 * 60);

    if (minutesAgo <= 5) {
      return position.speed > 0 ? 'moving' : 'online';
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
