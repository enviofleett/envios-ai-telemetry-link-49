
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle, VehiclePosition } from '@/types/vehicle';

export const useVehicleData = () => {
  // Fetch vehicles with user information
  const { data: vehicles = [], isLoading, error, refetch } = useQuery({
    queryKey: ['enhanced-vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          envio_users (
            name,
            email
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our Vehicle interface with proper type handling
      return data.map(vehicle => ({
        ...vehicle,
        last_position: vehicle.last_position as unknown as VehiclePosition
      })) as Vehicle[];
    },
    refetchInterval: 30000, // Fallback refresh every 30 seconds
  });

  // Set up real-time subscription for vehicle updates
  useEffect(() => {
    console.log('Setting up real-time subscription for vehicles...');
    
    const channel = supabase
      .channel('vehicles-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicles'
        },
        (payload) => {
          console.log('Real-time vehicle update received:', payload);
          // Refetch data when vehicles are updated
          refetch();
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    return () => {
      console.log('Cleaning up real-time subscription...');
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  return {
    vehicles,
    isLoading,
    error,
    refetch
  };
};
