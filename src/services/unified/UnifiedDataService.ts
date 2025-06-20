
import { supabase } from '@/integrations/supabase/client';
import { enhancedCachingService } from '@/services/performance/EnhancedCachingService';

export interface UnifiedVehicleData {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'inactive';
  lastUpdate: Date;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  user_id: string;
  gp51_device_id?: string;
}

export interface DataServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  loading?: boolean;
}

class UnifiedDataService {
  private static instance: UnifiedDataService;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  static getInstance(): UnifiedDataService {
    if (!UnifiedDataService.instance) {
      UnifiedDataService.instance = new UnifiedDataService();
    }
    return UnifiedDataService.instance;
  }

  // Unified vehicle data fetching with error handling and caching
  async getVehiclesForUser(userId: string): Promise<DataServiceResult<UnifiedVehicleData[]>> {
    const cacheKey = `vehicles-${userId}`;
    
    try {
      // Check cache first
      const cached = await enhancedCachingService.get<UnifiedVehicleData[]>(cacheKey);
      if (cached) {
        console.log('📋 Returning cached vehicle data for user:', userId);
        return { success: true, data: cached };
      }

      console.log('🔍 Fetching fresh vehicle data for user:', userId);
      
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Vehicle fetch error:', error);
        return { success: false, error: `Failed to fetch vehicles: ${error.message}` };
      }

      // Transform data to unified format
      const unifiedVehicles: UnifiedVehicleData[] = (vehicles || []).map(vehicle => ({
        id: vehicle.id,
        name: vehicle.name || vehicle.device_id || 'Unknown Vehicle',
        status: this.determineVehicleStatus(vehicle),
        lastUpdate: new Date(vehicle.updated_at || vehicle.created_at),
        location: vehicle.last_known_location ? {
          latitude: vehicle.last_known_location.lat || 0,
          longitude: vehicle.last_known_location.lng || 0,
          address: vehicle.last_known_location.address
        } : undefined,
        user_id: vehicle.user_id,
        gp51_device_id: vehicle.gp51_device_id
      }));

      // Cache the results
      await enhancedCachingService.set(cacheKey, unifiedVehicles, 5 * 60 * 1000); // 5 minutes

      console.log('✅ Vehicle data fetched successfully:', unifiedVehicles.length, 'vehicles');
      return { success: true, data: unifiedVehicles };

    } catch (error) {
      console.error('❌ Unexpected error fetching vehicles:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  // Unified user data fetching
  async getUserProfile(userId: string): Promise<DataServiceResult<any>> {
    const cacheKey = `user-profile-${userId}`;
    
    try {
      const cached = await enhancedCachingService.get(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }

      const { data: profile, error } = await supabase
        .from('envio_users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ User profile fetch error:', error);
        return { success: false, error: `Failed to fetch user profile: ${error.message}` };
      }

      await enhancedCachingService.set(cacheKey, profile, 10 * 60 * 1000); // 10 minutes
      return { success: true, data: profile };

    } catch (error) {
      console.error('❌ Unexpected error fetching user profile:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  // Invalidate cache for user data
  async invalidateUserCache(userId: string): Promise<void> {
    await enhancedCachingService.invalidateByPattern(new RegExp(`(vehicles|user-profile)-${userId}`));
  }

  // Health check for data services
  async healthCheck(): Promise<DataServiceResult<{ status: string; timestamp: Date }>> {
    try {
      const { error } = await supabase.from('envio_users').select('id').limit(1);
      
      if (error) {
        return { 
          success: false, 
          error: `Database health check failed: ${error.message}` 
        };
      }

      return { 
        success: true, 
        data: { 
          status: 'healthy', 
          timestamp: new Date() 
        } 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Health check failed' 
      };
    }
  }

  private determineVehicleStatus(vehicle: any): 'online' | 'offline' | 'inactive' {
    if (!vehicle.updated_at) return 'inactive';
    
    const lastUpdate = new Date(vehicle.updated_at);
    const now = new Date();
    const timeDiff = now.getTime() - lastUpdate.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    if (minutesDiff < 10) return 'online';
    if (minutesDiff < 60) return 'offline';
    return 'inactive';
  }
}

export const unifiedDataService = UnifiedDataService.getInstance();
