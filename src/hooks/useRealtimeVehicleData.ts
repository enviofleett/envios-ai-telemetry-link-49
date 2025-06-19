
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData } from '@/types/vehicle';

export const useRealtimeVehicleData = () => {
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    const fetchVehicles = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('*')
          .order('name', { ascending: true });

        if (vehiclesError) {
          throw vehiclesError;
        }

        if (!mounted) return;

        // Transform the data to match VehicleData interface
        const transformedVehicles: VehicleData[] = (vehiclesData || []).map(vehicle => ({
          id: vehicle.id,
          device_id: vehicle.gp51_device_id || '',
          device_name: vehicle.name || 'Unknown Device',
          status: 'offline' as const,
          isOnline: false,
          isMoving: false,
          lastUpdate: new Date(vehicle.updated_at || vehicle.created_at),
          last_position: undefined,
          sim_number: undefined
        }));

        setVehicles(transformedVehicles);
        setIsConnected(true);
      } catch (err) {
        if (!mounted) return;
        console.error('Error fetching vehicles:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch vehicles');
        setIsConnected(false);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    const setupRealtimeSubscription = () => {
      // Clean up existing channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      try {
        channelRef.current = supabase
          .channel('realtime-vehicles')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'vehicles'
            },
            (payload) => {
              console.log('Realtime vehicle change:', payload);
              if (mounted) {
                fetchVehicles();
              }
            }
          )
          .subscribe((status) => {
            console.log('Realtime subscription status:', status);
            if (mounted) {
              setIsConnected(status === 'SUBSCRIBED');
            }
          });
      } catch (err) {
        console.error('Failed to setup realtime subscription:', err);
        if (mounted) {
          setIsConnected(false);
        }
      }
    };

    // Initial fetch
    fetchVehicles();
    
    // Setup realtime subscription
    setupRealtimeSubscription();

    // Cleanup function
    return () => {
      mounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  return {
    vehicles,
    isLoading,
    error,
    isConnected
  };
};
