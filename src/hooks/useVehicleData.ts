import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData, VehicleDbRecord } from '@/types/vehicle';

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
    queryFn: async (): Promise<VehicleData[]> => {
      console.log('🚗 Fetching vehicle data with filters:', filters);
      
      let query = supabase
        .from('vehicles')
        .select(`
          id,
          gp51_device_id,
          name,
          created_at,
          updated_at,
          user_id,
          sim_number
        `)
        .order('updated_at', { ascending: false });

      // Apply search filter
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,gp51_device_id.ilike.%${filters.search}%`);
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

      if (!data) {
        return [];
      }

      // Transform data to VehicleData format
      const dbRecords: VehicleDbRecord[] = data;
      const transformedData: VehicleData[] = dbRecords.map(vehicle => ({
        id: vehicle.id,
        device_id: vehicle.gp51_device_id,
        device_name: vehicle.name,
        user_id: vehicle.user_id,
        sim_number: vehicle.sim_number,
        created_at: vehicle.created_at,
        updated_at: vehicle.updated_at,
        status: 'offline', // Default status, as it's not in DB
        lastUpdate: new Date(vehicle.updated_at),
        is_active: false, // Default value
        last_position: undefined,
        alerts: [],
        isOnline: false,
        isMoving: false,
      }));

      console.log('✅ Vehicle data fetched successfully:', transformedData.length, 'vehicles');
      return transformedData;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000, // Data is fresh for 15 seconds
  });
};
