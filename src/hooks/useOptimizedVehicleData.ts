import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface OptimizedVehicle {
  id: string;
  device_id: string;
  device_name: string;
  status: 'online' | 'offline';
  last_position?: {
    latitude: number;
    longitude: number;
    updatetime: string;
    speed?: number;
    course?: number;
  };
  assigned_user?: {
    id: string;
    name: string;
  };
}

interface OptimizedVehicleDataResponse {
  vehicles: OptimizedVehicle[];
  metadata: {
    lastFetch: Date;
    cacheStatus: 'fresh' | 'stale' | 'error';
    errorCount: number;
  };
}

interface UseOptimizedVehicleDataParams {
  enabled?: boolean;
  refreshInterval?: number;
}

export const useOptimizedVehicleData = (params: UseOptimizedVehicleDataParams = {}) => {
  const { enabled = true, refreshInterval = 30000 } = params;
  
  return useQuery({
    queryKey: ['optimized-vehicle-data'],
    queryFn: async (): Promise<OptimizedVehicleDataResponse> => {
      console.log('🔍 Fetching optimized vehicle data...');
      
      try {
        // Try the vehicle-management edge function first
        const { data: edgeFunctionData, error: edgeError } = await supabase.functions.invoke('vehicle-management', {
          body: { action: 'get_vehicles' },
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!edgeError && edgeFunctionData?.vehicles) {
          console.log('✅ Vehicle data fetched via edge function');
          return {
            vehicles: edgeFunctionData.vehicles,
            metadata: {
              lastFetch: new Date(),
              cacheStatus: 'fresh',
              errorCount: 0
            }
          };
        }

        console.warn('Edge function failed, falling back to direct database access:', edgeError);

        // Fallback to direct database access
        const { data: vehicles, error: vehiclesError } = await supabase
          .from('vehicles')
          .select(`
            id,
            gp51_device_id,
            name,
            envio_users(id, name)
          `)
          .order('name', { ascending: true });

        if (vehiclesError) {
          console.error('Direct database access failed:', vehiclesError);
          throw new Error(`Database access failed: ${vehiclesError.message}`);
        }

        console.log(`✅ Vehicle data fetched via direct access: ${vehicles?.length || 0} vehicles`);

        // Transform vehicle data with proper type checking and safe parsing
        const optimizedVehicles: OptimizedVehicle[] = (vehicles || []).map(vehicle => {
          return {
            id: vehicle.id,
            device_id: vehicle.gp51_device_id || '',
            device_name: vehicle.name || 'Unknown Device',
            status: 'offline', // No longer in DB, default to offline
            last_position: undefined, // No longer in DB
            assigned_user: vehicle.envio_users || undefined,
          };
        });

        return {
          vehicles: optimizedVehicles,
          metadata: {
            lastFetch: new Date(),
            cacheStatus: edgeError ? 'error' : 'fresh',
            errorCount: edgeError ? 1 : 0
          }
        };

      } catch (error) {
        console.error('Vehicle data fetch failed completely:', error);
        
        return {
          vehicles: [],
          metadata: {
            lastFetch: new Date(),
            cacheStatus: 'error',
            errorCount: 1
          }
        };
      }
    },
    enabled,
    refetchInterval: refreshInterval,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 15000,
  });
};
