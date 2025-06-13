
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

      // Transform the data to match our VehicleData interface with snake_case
      const transformedData: VehicleData[] = data.map(vehicle => {
        let lastPosition: VehicleData['last_position'];
        
        // Handle last position conversion, ensuring lng property
        if (vehicle.last_position && typeof vehicle.last_position === 'object') {
          const rawPosition = vehicle.last_position as any;
          if (rawPosition.lat && (rawPosition.lng || rawPosition.lon)) {
            lastPosition = {
              lat: rawPosition.lat,
              lng: rawPosition.lng || rawPosition.lon, // Handle both lng and lon
              speed: rawPosition.speed || 0,
              timestamp: typeof rawPosition.timestamp === 'string' 
                ? rawPosition.timestamp 
                : rawPosition.updatetime || new Date().toISOString()
            };
          }
        }

        return {
          id: vehicle.id,
          device_id: vehicle.device_id,
          device_name: vehicle.device_name,
          vin: vehicle.vin,
          license_plate: vehicle.license_plate,
          image_urls: vehicle.image_urls,
          fuel_tank_capacity_liters: vehicle.fuel_tank_capacity_liters,
          manufacturer_fuel_consumption_100km_l: vehicle.manufacturer_fuel_consumption_100km_l,
          insurance_expiration_date: vehicle.insurance_expiration_date,
          license_expiration_date: vehicle.license_expiration_date,
          is_active: vehicle.is_active,
          envio_user_id: vehicle.envio_user_id,
          last_position: lastPosition,
          envio_users: vehicle.envio_users,
          // Legacy compatibility
          vehicleName: vehicle.device_name,
          status: vehicle.is_active ? 'online' : 'offline',
          lastUpdate: lastPosition ? new Date(lastPosition.timestamp) : new Date(vehicle.updated_at || vehicle.created_at),
          alerts: [],
          isOnline: vehicle.is_active,
          isMoving: lastPosition ? lastPosition.speed > 0 : false,
          speed: lastPosition ? lastPosition.speed : 0
        };
      });

      console.log(`Successfully fetched ${transformedData.length} vehicles`);
      return transformedData;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Get unique users for filter options
  const userOptions = useMemo(() => {
    const users = vehicles
      .filter(v => v.envio_user_id)
      .map(v => ({
        id: v.envio_user_id!,
        name: v.device_name // Use device_name since envio_users join might not always work
      }));
    
    // Remove duplicates
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
          (vehicle.license_plate && vehicle.license_plate.toLowerCase().includes(searchTerm));
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all') {
        const status = vehicle.status?.toLowerCase() || '';
        switch (filters.status) {
          case 'active':
            if (!vehicle.is_active) return false;
            break;
          case 'moving':
            if (!status.includes('moving')) return false;
            break;
          case 'stopped':
            if (!status.includes('stopped') && !status.includes('idle')) return false;
            break;
          case 'alert':
            if (!status.includes('alert') && !status.includes('alarm')) return false;
            break;
          case 'offline':
            if (vehicle.is_active) return false;
            break;
        }
      }

      // Online filter
      if (filters.online !== 'all') {
        const isOnline = vehicle.last_position?.timestamp ? 
          new Date(vehicle.last_position.timestamp) > new Date(Date.now() - 30 * 60 * 1000) : 
          false;
        
        if (filters.online === 'online' && !isOnline) return false;
        if (filters.online === 'offline' && isOnline) return false;
      }

      // User filter
      if (filters.user !== 'all') {
        if (filters.user === 'unassigned' && vehicle.envio_user_id) return false;
        if (filters.user !== 'unassigned' && vehicle.envio_user_id !== filters.user) return false;
      }

      return true;
    });
  }, [vehicles, filters]);

  // Vehicle statistics
  const statistics: VehicleStatistics = useMemo(() => {
    const total = vehicles.length;
    const active = vehicles.filter(v => v.is_active).length;
    const online = vehicles.filter(v => {
      if (!v.last_position?.timestamp) return false;
      return new Date(v.last_position.timestamp) > new Date(Date.now() - 30 * 60 * 1000);
    }).length;
    const alerts = vehicles.filter(v => 
      v.status?.toLowerCase().includes('alert') || 
      v.status?.toLowerCase().includes('alarm')
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
    vehicles,
    filteredVehicles,
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
