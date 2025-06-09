
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VehicleDataFilters {
  search?: string;
  status?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export const useVehicleData = (filters: VehicleDataFilters = {}) => {
  return useQuery({
    queryKey: ['vehicles', filters],
    queryFn: async () => {
      console.log('🚗 Fetching vehicle data with filters:', filters);
      
      let query = supabase
        .from('vehicles')
        .select(`
          id,
          device_id,
          device_name,
          status,
          created_at,
          updated_at,
          vehicle_positions!left(
            lat,
            lon,
            speed,
            course,
            updatetime
          )
        `)
        .order('updated_at', { ascending: false });

      // Apply search filter
      if (filters.search) {
        query = query.or(`device_name.ilike.%${filters.search}%,device_id.ilike.%${filters.search}%`);
      }

      // Apply status filter
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      // Apply date range filter
      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.start)
          .lte('created_at', filters.dateRange.end);
      }

      const { data, error } = await query;

      if (error) {
        console.error('💥 Failed to fetch vehicle data:', error);
        throw error;
      }

      // Transform data to include lastPosition for easier access
      const transformedData = data?.map(vehicle => ({
        ...vehicle,
        lastPosition: vehicle.vehicle_positions?.[0] || null
      })) || [];

      console.log('✅ Vehicle data fetched successfully:', transformedData.length, 'vehicles');
      return transformedData;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000, // Data is fresh for 15 seconds
  });
};
