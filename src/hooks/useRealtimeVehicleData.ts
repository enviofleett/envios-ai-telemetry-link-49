
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { VehicleData } from '@/types/vehicle';
import { vehiclePositionSyncService } from '@/services/realtime/vehiclePositionSyncService';

interface VehicleEvent {
  id: string;
  vehicle_id: string;
  device_id: string;
  event_type: string;
  event_severity: string;
  event_message: string;
  event_data: any;
  is_acknowledged: boolean;
  occurred_at: string;
}

interface RealtimeVehicleData {
  vehicles: VehicleData[];
  events: VehicleEvent[];
  isLoading: boolean;
  isConnected: boolean;
  lastUpdate: Date | null;
  syncStatus: string;
  error: string | null;
}

export const useRealtimeVehicleData = () => {
  const { user } = useAuth();
  const [data, setData] = useState<RealtimeVehicleData>({
    vehicles: [],
    events: [],
    isLoading: true,
    isConnected: false,
    lastUpdate: null,
    syncStatus: 'idle',
    error: null
  });

  const channelRef = useRef<any>(null);
  const vehicleChannelRef = useRef<any>(null);
  const eventChannelRef = useRef<any>(null);

  // Initialize realtime subscriptions
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔄 Setting up realtime vehicle data subscriptions...');

    // Subscribe to vehicle updates
    vehicleChannelRef.current = supabase
      .channel('vehicle-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicles'
        },
        (payload) => {
          console.log('🚗 Vehicle update received:', payload);
          handleVehicleUpdate(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicle_position_history'
        },
        (payload) => {
          console.log('📍 Position update received:', payload);
          handlePositionUpdate(payload);
        }
      )
      .subscribe((status) => {
        console.log('Vehicle channel status:', status);
        setData(prev => ({ ...prev, isConnected: status === 'SUBSCRIBED' }));
      });

    // Subscribe to vehicle events
    eventChannelRef.current = supabase
      .channel('vehicle-events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicle_events'
        },
        (payload) => {
          console.log('🔔 Vehicle event received:', payload);
          handleEventUpdate(payload);
        }
      )
      .subscribe();

    // Subscribe to sync status updates
    channelRef.current = supabase
      .channel('sync-status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sync_status'
        },
        (payload) => {
          console.log('📊 Sync status update:', payload);
          handleSyncStatusUpdate(payload);
        }
      )
      .subscribe();

    // Load initial data
    loadInitialData();

    // Start sync service
    vehiclePositionSyncService.startPeriodicSync();

    // Subscribe to sync service status
    const unsubscribeSync = vehiclePositionSyncService.subscribeToStatus((status) => {
      setData(prev => ({ ...prev, syncStatus: status }));
    });

    return () => {
      if (vehicleChannelRef.current) {
        supabase.removeChannel(vehicleChannelRef.current);
      }
      if (eventChannelRef.current) {
        supabase.removeChannel(eventChannelRef.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      unsubscribeSync();
    };
  }, [user?.id]);

  const loadInitialData = async () => {
    if (!user?.id) return;

    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      // Load vehicles
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select(`
          id,
          gp51_device_id,
          name,
          sim_number,
          user_id,
          created_at,
          updated_at,
          envio_users (
            name,
            email
          )
        `)
        .order('updated_at', { ascending: false });

      if (vehiclesError) throw vehiclesError;

      // Load recent events
      const { data: events, error: eventsError } = await supabase
        .from('vehicle_events')
        .select('*')
        .eq('is_acknowledged', false)
        .order('occurred_at', { ascending: false })
        .limit(50);

      if (eventsError) throw eventsError;

      // Transform vehicles data
      const transformedVehicles: VehicleData[] = (vehicles || []).map(vehicle => ({
        id: vehicle.id,
        device_id: vehicle.gp51_device_id,
        device_name: vehicle.name,
        sim_number: vehicle.sim_number,
        user_id: vehicle.user_id,
        created_at: vehicle.created_at,
        updated_at: vehicle.updated_at,
        envio_users: vehicle.envio_users,
        status: determineVehicleStatus(vehicle.updated_at),
        is_active: true,
        lastUpdate: new Date(vehicle.updated_at),
        isOnline: isVehicleOnline(vehicle.updated_at),
        isMoving: false, // Will be updated with position data
        alerts: [],
      }));

      setData(prev => ({
        ...prev,
        vehicles: transformedVehicles,
        events: events || [],
        isLoading: false,
        lastUpdate: new Date()
      }));

    } catch (error) {
      console.error('Failed to load initial vehicle data:', error);
      setData(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load data',
        isLoading: false
      }));
    }
  };

  const handleVehicleUpdate = (payload: any) => {
    setData(prev => {
      const updatedVehicles = [...prev.vehicles];
      const index = updatedVehicles.findIndex(v => v.id === payload.new?.id || v.id === payload.old?.id);

      if (payload.eventType === 'DELETE' && index !== -1) {
        updatedVehicles.splice(index, 1);
      } else if (payload.eventType === 'INSERT' && payload.new) {
        const newVehicle: VehicleData = {
          id: payload.new.id,
          device_id: payload.new.gp51_device_id,
          device_name: payload.new.name,
          sim_number: payload.new.sim_number,
          user_id: payload.new.user_id,
          created_at: payload.new.created_at,
          updated_at: payload.new.updated_at,
          status: determineVehicleStatus(payload.new.updated_at),
          is_active: true,
          lastUpdate: new Date(payload.new.updated_at),
          isOnline: isVehicleOnline(payload.new.updated_at),
          isMoving: false,
          alerts: [],
        };
        updatedVehicles.push(newVehicle);
      } else if (payload.eventType === 'UPDATE' && index !== -1 && payload.new) {
        updatedVehicles[index] = {
          ...updatedVehicles[index],
          device_name: payload.new.name,
          updated_at: payload.new.updated_at,
          status: determineVehicleStatus(payload.new.updated_at),
          lastUpdate: new Date(payload.new.updated_at),
          isOnline: isVehicleOnline(payload.new.updated_at),
        };
      }

      return {
        ...prev,
        vehicles: updatedVehicles,
        lastUpdate: new Date()
      };
    });
  };

  const handlePositionUpdate = (payload: any) => {
    if (payload.eventType === 'INSERT' && payload.new) {
      setData(prev => {
        const updatedVehicles = prev.vehicles.map(vehicle => {
          if (vehicle.device_id === payload.new.device_id) {
            return {
              ...vehicle,
              last_position: {
                latitude: payload.new.latitude,
                longitude: payload.new.longitude,
                speed: payload.new.speed,
                course: payload.new.heading,
                timestamp: payload.new.recorded_at
              },
              isMoving: payload.new.speed > 0,
              lastUpdate: new Date(payload.new.recorded_at)
            };
          }
          return vehicle;
        });

        return {
          ...prev,
          vehicles: updatedVehicles,
          lastUpdate: new Date()
        };
      });
    }
  };

  const handleEventUpdate = (payload: any) => {
    if (payload.eventType === 'INSERT' && payload.new) {
      setData(prev => ({
        ...prev,
        events: [payload.new, ...prev.events].slice(0, 50) // Keep only latest 50 events
      }));
    } else if (payload.eventType === 'UPDATE' && payload.new) {
      setData(prev => ({
        ...prev,
        events: prev.events.map(event => 
          event.id === payload.new.id ? payload.new : event
        )
      }));
    }
  };

  const handleSyncStatusUpdate = (payload: any) => {
    if (payload.new?.sync_type === 'vehicle_positions') {
      setData(prev => ({
        ...prev,
        syncStatus: payload.new.status || 'unknown'
      }));
    }
  };

  const acknowledgeEvent = async (eventId: string) => {
    try {
      await supabase
        .from('vehicle_events')
        .update({
          is_acknowledged: true,
          acknowledged_by: user?.id,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', eventId);
    } catch (error) {
      console.error('Failed to acknowledge event:', error);
    }
  };

  const forceSync = async () => {
    try {
      await vehiclePositionSyncService.forceSync();
    } catch (error) {
      console.error('Failed to force sync:', error);
    }
  };

  return {
    ...data,
    acknowledgeEvent,
    forceSync,
    refreshData: loadInitialData
  };
};

// Helper functions
const determineVehicleStatus = (lastUpdate: string): 'online' | 'offline' | 'idle' => {
  const now = new Date();
  const updateTime = new Date(lastUpdate);
  const minutesAgo = (now.getTime() - updateTime.getTime()) / (1000 * 60);

  if (minutesAgo <= 5) return 'online';
  if (minutesAgo <= 30) return 'idle';
  return 'offline';
};

const isVehicleOnline = (lastUpdate: string): boolean => {
  const now = new Date();
  const updateTime = new Date(lastUpdate);
  const minutesAgo = (now.getTime() - updateTime.getTime()) / (1000 * 60);
  return minutesAgo <= 5;
};
