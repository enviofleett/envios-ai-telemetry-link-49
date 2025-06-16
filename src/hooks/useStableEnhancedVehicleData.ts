
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
        const status: VehicleStatus = 'offline';
        
        return {
          id: dbVehicle.id,
          device_id: dbVehicle.gp51_device_id,
          device_name: dbVehicle.name,
          sim_number: dbVehicle.sim_number,
          user_id: dbVehicle.user_id,
          created_at: dbVehicle.created_at,
          updated_at: dbVehicle.updated_at,
          envio_users: dbVehicle.envio_users,
          status: status,
          is_active: true, // Default to true
          last_position: undefined,
          lastUpdate: new Date(dbVehicle.updated_at),
          isOnline: status === 'online',
          isMoving: false,
          alerts: [],
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

      // Status filter - handle the comparison properly
      if (filters.status !== 'all') {
        if (filters.status === 'active' && !vehicle.is_active) return false;
        if (filters.status !== 'active' && filters.status !== 'offline' && filters.status !== 'online') return false;
        if ((filters.status === 'online' || filters.status === 'offline') && filters.status !== vehicle.status) return false;
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
