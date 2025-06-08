
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
            device_id,
            device_name,
            status,
            last_position,
            assigned_user:envio_users(id, name)
          `)
          .order('device_name', { ascending: true });

        if (vehiclesError) {
          console.error('Direct database access failed:', vehiclesError);
          throw new Error(`Database access failed: ${vehiclesError.message}`);
        }

        console.log(`✅ Vehicle data fetched via direct access: ${vehicles?.length || 0} vehicles`);

        // Transform vehicle data
        const optimizedVehicles: OptimizedVehicle[] = (vehicles || []).map(vehicle => ({
          id: vehicle.id,
          device_id: vehicle.device_id || '',
          device_name: vehicle.device_name || 'Unknown Device',
          status: vehicle.status || 'offline',
          last_position: vehicle.last_position || undefined,
          assigned_user: vehicle.assigned_user || undefined
        }));

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
