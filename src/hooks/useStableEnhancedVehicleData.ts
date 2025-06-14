import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VehicleData, FilterState, VehicleStatistics } from '@/types/vehicle';

export const useStableEnhancedVehicleData = () => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    user: 'all',
    online: 'all'
  });

  // Fetch vehicles with user information
  const { data: vehicles = [], isLoading, error, refetch } = useQuery({
    queryKey: ['stable-enhanced-vehicles'],
    queryFn: async () => {
      console.log('Fetching vehicles with user information...');
      
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
        console.error('Error fetching vehicles:', error);
        throw error;
      }

      // Transform the data to match our VehicleData interface
      const transformedData: VehicleData[] = data.map(dbVehicle => {
        let appLastPosition: VehicleData['last_position'] = undefined;
        const rawDbPosition = dbVehicle.last_position as any; // Data from Supabase potentially with lat/lng/lon
        
        if (rawDbPosition && (rawDbPosition.lat != null && (rawDbPosition.lng != null || rawDbPosition.lon != null))) {
          appLastPosition = {
            latitude: rawDbPosition.lat,
            longitude: rawDbPosition.lng || rawDbPosition.lon,
            speed: rawDbPosition.speed || 0,
            course: rawDbPosition.course || 0,
            timestamp: typeof rawDbPosition.timestamp === 'string' 
              ? rawDbPosition.timestamp 
              : rawDbPosition.updatetime || new Date().toISOString()
          };
        }

        // Determine status based on the transformed appLastPosition and dbVehicle.is_active
        let status: VehicleData['status'] = 'offline';
        if (dbVehicle.is_active) {
            if (appLastPosition && appLastPosition.timestamp) {
                const lastUpdate = new Date(appLastPosition.timestamp);
                const minutesSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60);
                if (minutesSinceUpdate <= 5) {
                    status = appLastPosition.speed > 0 ? 'moving' : 'online';
                } else if (minutesSinceUpdate <= 30) {
                    status = 'idle';
                } else {
                    status = 'offline'; // if active but position is too old
                }
            } else {
                 status = 'idle'; // Active but no position data, consider idle or online based on policy
            }
        }

        return {
          id: dbVehicle.id,
          device_id: dbVehicle.device_id,
          device_name: dbVehicle.device_name,
          vin: dbVehicle.vin,
          license_plate: dbVehicle.license_plate,
          image_urls: dbVehicle.image_urls,
          fuel_tank_capacity_liters: dbVehicle.fuel_tank_capacity_liters,
          manufacturer_fuel_consumption_100km_l: dbVehicle.manufacturer_fuel_consumption_100km_l,
          insurance_expiration_date: dbVehicle.insurance_expiration_date,
          license_expiration_date: dbVehicle.license_expiration_date,
          is_active: dbVehicle.is_active,
          envio_user_id: dbVehicle.envio_user_id,
          last_position: appLastPosition, // This is correctly {latitude, longitude}
          envio_users: dbVehicle.envio_users,
          
          // Legacy and status properties for VehicleData
          status: status,
          lastUpdate: appLastPosition ? new Date(appLastPosition.timestamp) : new Date(dbVehicle.updated_at || dbVehicle.created_at),
          isOnline: status === 'online' || status === 'moving',
          isMoving: status === 'moving',
          speed: appLastPosition?.speed || 0,
          course: appLastPosition?.course || 0,
          alerts: [], // Assuming alerts are handled elsewhere or default to empty

          // Redundant legacy fields if not strictly needed by VehicleData type, but keeping for compatibility if used
          vehicleName: dbVehicle.device_name,
          // lastPosition: appLastPosition, // if VehicleData.lastPosition expects {latitude, longitude}
        };
      });

      console.log(`Successfully fetched ${transformedData.length} vehicles`);
      return transformedData;
    },
    refetchInterval: 30000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Get unique users for filter options
  const userOptions = useMemo(() => {
    const users = vehicles
      .filter(v => v.envio_user_id)
      .map(v => ({
        id: v.envio_user_id!,
        name: v.envio_users?.name || v.device_name // Prefer joined user name
      }));
    
    const uniqueUsers = users.filter((user, index, self) => 
      index === self.findIndex(u => u.id === user.id)
    );
    
    return uniqueUsers;
  }, [vehicles]);

  // Filter vehicles based on current filters
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = 
          vehicle.device_name.toLowerCase().includes(searchTerm) ||
          vehicle.device_id.toLowerCase().includes(searchTerm) ||
          (vehicle.license_plate && vehicle.license_plate.toLowerCase().includes(searchTerm)) ||
          (vehicle.vin && vehicle.vin.toLowerCase().includes(searchTerm));
        
        if (!matchesSearch) return false;
      }

      // Status filter (based on VehicleData's status property)
      if (filters.status !== 'all') {
        const vehicleStatus = vehicle.status || 'offline'; // Default to offline if undefined
        if (filters.status === 'active' && !vehicle.is_active) return false; // is_active might be more reliable for "active" filter
        if (filters.status === 'moving' && vehicleStatus !== 'moving') return false;
        if (filters.status === 'online' && vehicleStatus !== 'online' && vehicleStatus !== 'moving') return false;
        if (filters.status === 'idle' && vehicleStatus !== 'idle') return false;
        if (filters.status === 'offline' && vehicleStatus !== 'offline') return false;
        // 'alert' status would need specific handling if alerts are part of VehicleData
      }

      // User filter
      if (filters.user !== 'all') {
        if (filters.user === 'unassigned' && vehicle.envio_user_id) return false;
        if (filters.user !== 'unassigned' && vehicle.envio_user_id !== filters.user) return false;
      }

      // Online filter (more specific than status, based on recent timestamp)
      // This might be redundant if 'status' already correctly reflects this.
      if (filters.online !== 'all') {
        const isConsideredOnline = vehicle.last_position?.timestamp ? 
          new Date(vehicle.last_position.timestamp) > new Date(Date.now() - 5 * 60 * 1000) : // 5 minutes for truly online
          false;
        
        if (filters.online === 'online' && !isConsideredOnline) return false;
        if (filters.online === 'offline' && isConsideredOnline) return false;
      }

      return true;
    });
  }, [vehicles, filters]);

  // Vehicle statistics
  const statistics: VehicleStatistics = useMemo(() => {
    const total = vehicles.length;
    const active = vehicles.filter(v => v.is_active).length; // Based on is_active flag
    const online = vehicles.filter(v => v.status === 'online' || v.status === 'moving').length; // Based on derived status
    const alerts = vehicles.filter(v => 
      v.alerts && v.alerts.length > 0 // Assuming alerts is an array
    ).length;

    return { total, active, online, alerts };
  }, [vehicles]);

  const handleVehicleAction = {
    viewMap: (vehicle: VehicleData) => {
      console.log('View map for vehicle:', vehicle.device_id);
      // TODO: Implement map view
    },
    
    viewHistory: (vehicle: VehicleData) => {
      console.log('View history for vehicle:', vehicle.device_id);
      // TODO: Implement history view
    },
    
    viewDetails: (vehicle: VehicleData) => {
      console.log('View details for vehicle:', vehicle.device_id);
      // TODO: Implement details view
    },
    
    sendCommand: (vehicle: VehicleData) => {
      console.log('Send command to vehicle:', vehicle.device_id);
      // TODO: Implement command sending
    }
  };

  return {
    vehicles, // This is Array<VehicleData> with last_position: {latitude, longitude}
    filteredVehicles, // Same as above
    userOptions,
    statistics,
    filters,
    setFilters,
    isLoading,
    error,
    refetch,
    handleVehicleAction
  };
};
