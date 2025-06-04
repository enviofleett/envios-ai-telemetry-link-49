
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle, VehiclePosition } from '@/types/vehicle';

export const useStableVehicleData = () => {
  // Stable vehicle data fetching with proper error handling
  const { data: vehicles = [], isLoading, error, refetch } = useQuery({
    queryKey: ['stable-vehicles'],
    queryFn: async () => {
      try {
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

        if (error) {
          console.error('Vehicle fetch error:', error);
          throw error;
        }
        
        // Transform data with proper type handling
        return (data || []).map(vehicle => ({
          ...vehicle,
          last_position: vehicle.last_position as unknown as VehiclePosition
        })) as Vehicle[];
      } catch (err) {
        console.error('Critical vehicle data fetch error:', err);
        throw err;
      }
    },
    refetchInterval: 60000, // Stable 60-second refresh
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Set up stable real-time subscription with proper cleanup
  useEffect(() => {
    let isSubscribed = true;
    
    console.log('Setting up stable real-time subscription...');
    
    const channel = supabase
      .channel('stable-vehicles-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicles'
        },
        (payload) => {
          if (isSubscribed) {
            console.log('Stable real-time vehicle update:', payload);
            // Only refetch if we're still subscribed
            refetch();
          }
        }
      )
      .subscribe((status) => {
        console.log('Stable subscription status:', status);
      });

    return () => {
      isSubscribed = false;
      console.log('Cleaning up stable real-time subscription...');
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
