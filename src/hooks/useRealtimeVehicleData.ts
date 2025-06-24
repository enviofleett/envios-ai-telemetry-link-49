import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData } from '@/types/vehicle';

interface VehicleEvent {
  id: string;
  device_id: string;
  event_type: string;
  event_severity: string;
  event_message: string;
  occurred_at: string;
  is_acknowledged: boolean;
}

export const useRealtimeVehicleData = () => {
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'completed' | 'error' | 'running'>('idle');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [events, setEvents] = useState<VehicleEvent[]>([]);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    const fetchVehicles = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setSyncStatus('syncing');

        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('*')
          .order('name', { ascending: true });

        if (vehiclesError) {
          throw vehiclesError;
        }

        if (!mounted) return;

        // Transform the data to match VehicleData interface with all required properties
        const transformedVehicles: VehicleData[] = (vehiclesData || []).map(vehicle => ({
          id: vehicle.id,
          device_id: vehicle.gp51_device_id || '',
          device_name: vehicle.name || 'Unknown Device',
          name: vehicle.name || 'Unknown Device', // FIXED: Add the required name property
          user_id: vehicle.user_id,
          sim_number: vehicle.sim_number,
          created_at: vehicle.created_at,
          updated_at: vehicle.updated_at,
          vin: (vehicle as any).vin || null,
          license_plate: (vehicle as any).license_plate || null,
          is_active: true, // Default value
          last_position: undefined,
          status: 'offline' as const,
          isOnline: false,
          isMoving: false,
          alerts: [], // Default empty array
          lastUpdate: new Date(vehicle.updated_at || vehicle.created_at),
        }));

        setVehicles(transformedVehicles);
        setIsConnected(true);
        setSyncStatus('completed');
        setLastUpdate(new Date());
      } catch (err) {
        if (!mounted) return;
        console.error('Error fetching vehicles:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch vehicles');
        setIsConnected(false);
        setSyncStatus('error');
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

  const forceSync = async () => {
    setSyncStatus('syncing');
    try {
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .order('name', { ascending: true });

      if (vehiclesError) {
        throw vehiclesError;
      }

      const transformedVehicles: VehicleData[] = (vehiclesData || []).map(vehicle => ({
        id: vehicle.id,
        device_id: vehicle.gp51_device_id || '',
        device_name: vehicle.name || 'Unknown Device',
        name: vehicle.name || 'Unknown Device', // FIXED: Add the required name property
        user_id: vehicle.user_id,
        sim_number: vehicle.sim_number,
        created_at: vehicle.created_at,
        updated_at: vehicle.updated_at,
        vin: (vehicle as any).vin || null,
        license_plate: (vehicle as any).license_plate || null,
        is_active: true,
        last_position: undefined,
        status: 'offline' as const,
        isOnline: false,
        isMoving: false,
        alerts: [],
        lastUpdate: new Date(vehicle.updated_at || vehicle.created_at),
      }));

      setVehicles(transformedVehicles);
      setSyncStatus('completed');
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Force sync failed:', err);
      setSyncStatus('error');
      setError(err instanceof Error ? err.message : 'Force sync failed');
    }
  };

  const acknowledgeEvent = async (eventId: string) => {
    try {
      // Mock implementation - update event as acknowledged
      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, is_acknowledged: true }
          : event
      ));
    } catch (err) {
      console.error('Failed to acknowledge event:', err);
    }
  };

  return {
    vehicles,
    isLoading,
    error,
    isConnected,
    syncStatus,
    lastUpdate,
    forceSync,
    events,
    acknowledgeEvent
  };
};
