
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { telemetryApi } from '@/services/telemetryApi';

interface Vehicle {
  deviceid: string;
  devicename: string;
  status?: string;
  lastPosition?: {
    lat: number;
    lon: number;
    speed: number;
    course: number;
    updatetime: string;
    statusText: string;
  };
}

interface VehiclePositionData {
  lat: number;
  lon: number;
  speed: number;
  course: number;
  updatetime: string;
  statusText: string;
}

export const useVehicleData = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Fetch ALL vehicles from database (removed limit)
  const { data: dbVehicles, isLoading, refetch } = useQuery({
    queryKey: ['all-vehicles'],
    queryFn: async () => {
      console.log('Fetching all vehicles from database...');
      
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching vehicles:', error);
        throw error;
      }

      console.log(`Successfully fetched ${data?.length || 0} vehicles from database`);

      // Transform database vehicles to match the Vehicle interface
      const transformedVehicles: Vehicle[] = (data || []).map(vehicle => {
        let lastPosition: VehiclePositionData | undefined = undefined;
        
        // Safely parse the JSONB last_position field
        if (vehicle.last_position && typeof vehicle.last_position === 'object') {
          const positionData = vehicle.last_position as any;
          lastPosition = {
            lat: positionData.lat || 0,
            lon: positionData.lon || 0,
            speed: positionData.speed || 0,
            course: positionData.course || 0,
            updatetime: positionData.updatetime || '',
            statusText: positionData.statusText || ''
          };
        }

        return {
          deviceid: vehicle.device_id,
          devicename: vehicle.device_name,
          status: vehicle.status,
          lastPosition
        };
      });

      return transformedVehicles;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Update local state when database data changes
  useEffect(() => {
    if (dbVehicles) {
      setVehicles(dbVehicles);
    }
  }, [dbVehicles]);

  const fetchVehicles = async (): Promise<void> => {
    await refetch();
  };

  const fetchPositions = async (): Promise<void> => {
    try {
      console.log('Fetching positions via telemetry API...');
      const deviceIds = vehicles.map(v => v.deviceid);
      const response = await telemetryApi.getVehiclePositions(deviceIds);
      
      if (response.success && response.positions) {
        console.log(`Received ${response.positions.length} positions from telemetry API`);
        
        // Update vehicles with new position data
        const updatedVehicles = vehicles.map(vehicle => {
          const position = response.positions?.find(p => p.deviceid === vehicle.deviceid);
          return position ? {
            ...vehicle,
            lastPosition: {
              lat: position.lat,
              lon: position.lon,
              speed: position.speed,
              course: position.course,
              updatetime: position.updatetime,
              statusText: position.statusText
            }
          } : vehicle;
        });
        
        setVehicles(updatedVehicles);
      }
    } catch (error) {
      console.error('Failed to fetch positions:', error);
    }
  };

  return {
    vehicles,
    isLoading,
    fetchVehicles,
    fetchPositions,
    refetch
  };
};
