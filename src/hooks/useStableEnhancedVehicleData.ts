import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VehicleData, FilterState, VehicleStatistics } from '@/types/vehicle';
import { VehicleDbRecord } from '@/types/vehicle'; // Using the new DbRecord type

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
      const transformedData: VehicleData[] = (data || []).map((dbVehicle: VehicleDbRecord & { envio_users: any }) => {
        // is_active and status are no longer in the DB. Defaulting them.
        const status: VehicleData['status'] = 'offline';
        
        return {
          id: dbVehicle.id,
          device_id: dbVehicle.gp51_device_id,
          device_name: dbVehicle.name,
          sim_number: dbVehicle.sim_number,
          user_id: dbVehicle.user_id,
          created_at: dbVehicle.created_at,
          updated_at: dbVehicle.updated_at,
          envio_users: dbVehicle.envio_users,
          
          // Derived and default properties
          status: status,
          is_active: true, // Default to true
          last_position: undefined, // No longer in DB
          lastUpdate: new Date(dbVehicle.updated_at),
          isOnline: status === 'online' || status === 'moving',
          isMoving: status === 'moving',
          alerts: [],
          vehicleName: dbVehicle.name,
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
      .filter(v => v.user_id)
      .map(v => ({
        id: v.user_id!,
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
          vehicle.device_id.toLowerCase().includes(searchTerm);
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all') {
        const vehicleStatus = vehicle.status || 'offline';
        if (filters.status === 'active' && !vehicle.is_active) return false;
        if (filters.status !== 'active' && vehicleStatus !== filters.status) return false;
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
    const online = vehicles.filter(v => v.status === 'online' || v.status === 'moving').length;
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
