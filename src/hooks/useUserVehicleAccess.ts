
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData } from '@/types/vehicle';

export const useUserVehicleAccess = (userId?: string) => {
  const assignedVehiclesQuery = useQuery({
    queryKey: ['user-vehicles', userId],
    queryFn: async (): Promise<VehicleData[]> => {
      if (!userId) return [];
      
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select(`
          id,
          gp51_device_id,
          name,
          sim_number,
          user_id,
          created_at,
          updated_at
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user vehicles:', error);
        throw error;
      }

      return (vehicles || []).map(vehicle => ({
        id: vehicle.id,
        device_id: vehicle.gp51_device_id,
        gp51_device_id: vehicle.gp51_device_id, // Added missing property
        device_name: vehicle.name,
        name: vehicle.name,
        user_id: vehicle.user_id,
        sim_number: vehicle.sim_number,
        created_at: vehicle.created_at,
        updated_at: vehicle.updated_at,
        status: 'offline',
        is_active: true,
        isOnline: false,
        isMoving: false,
        alerts: [],
        lastUpdate: new Date()
      }));
    },
    enabled: !!userId
  });

  const unassignedVehiclesQuery = useQuery({
    queryKey: ['unassigned-vehicles'],
    queryFn: async (): Promise<VehicleData[]> => {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select(`
          id,
          gp51_device_id,
          name,
          sim_number,
          user_id,
          created_at,
          updated_at
        `)
        .is('user_id', null);

      if (error) {
        console.error('Error fetching unassigned vehicles:', error);
        throw error;
      }

      return (vehicles || []).map(vehicle => ({
        id: vehicle.id,
        device_id: vehicle.gp51_device_id,
        gp51_device_id: vehicle.gp51_device_id, // Added missing property
        device_name: vehicle.name,
        name: vehicle.name,
        user_id: vehicle.user_id,
        sim_number: vehicle.sim_number,
        created_at: vehicle.created_at,
        updated_at: vehicle.updated_at,
        status: 'offline',
        is_active: true,
        isOnline: false,
        isMoving: false,
        alerts: [],
        lastUpdate: new Date()
      }));
    }
  });

  return {
    assignedVehicles: assignedVehiclesQuery.data || [],
    unassignedVehicles: unassignedVehiclesQuery.data || [],
    isLoading: assignedVehiclesQuery.isLoading || unassignedVehiclesQuery.isLoading,
    error: assignedVehiclesQuery.error || unassignedVehiclesQuery.error,
    refetch: () => {
      assignedVehiclesQuery.refetch();
      unassignedVehiclesQuery.refetch();
    }
  };
};
