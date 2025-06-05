
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { vehiclePositionSyncService } from '@/services/vehiclePosition/vehiclePositionSyncService';
import type { SyncMetrics } from '@/services/vehiclePosition/types';
import { Vehicle } from '@/types/vehicle';
import { isVehiclePosition } from './utils';

export const useVehiclePositions = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncMetrics, setSyncMetrics] = useState<SyncMetrics>(vehiclePositionSyncService.getMetrics());

  // Fetch vehicles with real-time updates
  const { data: vehicles = [], isLoading, refetch } = useQuery({
    queryKey: ['vehicle-positions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our Vehicle interface
      const transformedData: Vehicle[] = data.map(vehicle => ({
        ...vehicle,
        last_position: vehicle.last_position && isVehiclePosition(vehicle.last_position) ? {
          lat: vehicle.last_position.lat,
          lon: vehicle.last_position.lon,
          speed: vehicle.last_position.speed,
          course: vehicle.last_position.course,
          updatetime: vehicle.last_position.updatetime,
          statusText: vehicle.last_position.statusText
        } : undefined
      }));

      return transformedData;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Update sync metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setSyncMetrics(vehiclePositionSyncService.getMetrics());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleForceSync = async () => {
    setIsRefreshing(true);
    try {
      await vehiclePositionSyncService.forceSync();
      await refetch();
      setSyncMetrics(vehiclePositionSyncService.getMetrics());
    } catch (error) {
      console.error('Force sync failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    vehicles,
    isLoading,
    isRefreshing,
    syncMetrics,
    handleForceSync,
    refetch
  };
};
