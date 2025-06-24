import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VehicleData, FilterState, VehicleStatistics, VehicleDbRecord, VehicleStatus } from '@/types/vehicle';

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
    queryFn: async (): Promise<VehicleData[]> => {
      console.log('Fetching vehicles with user information...');
      
      const { data, error } = await supabase
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

      if (error) {
        console.error('Error fetching vehicles:', error);
        throw error;
      }
      
      if (!data) {
        return [];
      }

      // Transform the data to match our VehicleData interface
      const dbRecords: (VehicleDbRecord & { envio_users: any })[] = data;
      const transformedData: VehicleData[] = dbRecords.map((dbVehicle) => {
        // Determine status dynamically - this fixes the type inference issue
        const isAssigned = Boolean(dbVehicle.user_id);
        const status: VehicleStatus = isAssigned ? 'active' : 'offline';
        const isOnline = status === 'active';
        
        return {
          id: dbVehicle.id,
          device_id: dbVehicle.gp51_device_id,
          device_name: dbVehicle.name,
          name: dbVehicle.name, // FIXED: Add the required name property
          sim_number: dbVehicle.sim_number,
          user_id: dbVehicle.user_id,
          created_at: dbVehicle.created_at,
          updated_at: dbVehicle.updated_at,
          envio_users: dbVehicle.envio_users,
          status: status,
          is_active: isAssigned,
          last_position: undefined,
          lastUpdate: new Date(dbVehicle.updated_at),
          isOnline: isOnline,
          isMoving: false,
          alerts: [],
          // Initialize additional properties from VehicleData interface
          vin: undefined,
          license_plate: undefined,
          image_urls: undefined,
          fuel_tank_capacity_liters: undefined,
          manufacturer_fuel_consumption_100km_l: undefined,
          speed: undefined,
          course: undefined,
          driver: undefined,
          fuel: undefined,
          mileage: undefined,
          plateNumber: undefined,
          model: undefined,
          gp51_metadata: undefined,
          insurance_expiration_date: undefined,
          license_expiration_date: undefined,
          location: undefined
        };
      });

      console.log(`Successfully fetched ${transformedData.length} vehicles`);
      return transformedData;
    },
    refetchInterval: 30000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Get unique users for filter options - FIXED: Added email property
  const userOptions = useMemo(() => {
    const users = vehicles
      .filter(v => v.user_id)
      .map(v => ({
        id: v.user_id!,
        name: v.envio_users?.name || v.device_name,
        email: v.envio_users?.email || ''
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
          vehicle.device_id.toLowerCase().includes(searchTerm);
        
        if (!matchesSearch) return false;
      }

      // Status filter - use consistent property access
      if (filters.status !== 'all') {
        if (filters.status === 'active') {
          if (!vehicle.is_active) return false;
        } else if (filters.status === 'online') {
          if (!vehicle.isOnline) return false;
        } else if (filters.status === 'offline') {
          if (vehicle.isOnline) return false;
        }
      }

      // Online filter - separate from status filter
      if (filters.online !== 'all') {
        if (filters.online === 'online' && !vehicle.isOnline) return false;
        if (filters.online === 'offline' && vehicle.isOnline) return false;
      }

      // User filter
      if (filters.user !== 'all') {
        if (filters.user === 'unassigned' && vehicle.user_id) return false;
        if (filters.user !== 'unassigned' && vehicle.user_id !== filters.user) return false;
      }

      return true;
    });
  }, [vehicles, filters]);

  // Vehicle statistics
  const statistics: VehicleStatistics = useMemo(() => {
    const total = vehicles.length;
    const active = vehicles.filter(v => v.is_active).length;
    const online = vehicles.filter(v => v.isOnline || v.isMoving).length;
    const alerts = vehicles.filter(v => v.alerts && v.alerts.length > 0).length;

    return { total, active, online, alerts };
  }, [vehicles]);

  return {
    vehicles,
    filteredVehicles,
    statistics,
    isLoading,
    error,
    refetch,
    setFilters,
    userOptions,
  };
};
