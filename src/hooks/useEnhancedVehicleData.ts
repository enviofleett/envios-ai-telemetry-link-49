
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VehiclePosition {
  lat: number;
  lon: number;
  speed: number;
  course: number;
  updatetime: string;
  statusText: string;
}

interface Vehicle {
  id: string;
  device_id: string;
  device_name: string;
  status?: string;
  sim_number?: string;
  notes?: string;
  is_active: boolean;
  last_position?: VehiclePosition;
  envio_user_id?: string;
  gp51_metadata?: any;
  created_at: string;
  updated_at: string;
  envio_users?: {
    name: string;
    email: string;
  };
}

interface FilterState {
  search: string;
  status: string;
  user: string;
  online: string;
}

export const useEnhancedVehicleData = () => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    user: 'all',
    online: 'all'
  });

  // Fetch vehicles with user information
  const { data: vehicles = [], isLoading, error, refetch } = useQuery({
    queryKey: ['enhanced-vehicles'],
    queryFn: async () => {
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

      if (error) throw error;
      
      // Transform the data to match our Vehicle interface with proper type handling
      return data.map(vehicle => ({
        ...vehicle,
        last_position: vehicle.last_position as unknown as VehiclePosition
      })) as Vehicle[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get unique users for filter options
  const userOptions = useMemo(() => {
    const users = vehicles
      .filter(v => v.envio_users)
      .map(v => ({
        id: v.envio_user_id!,
        name: v.envio_users!.name
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
          (vehicle.sim_number && vehicle.sim_number.toLowerCase().includes(searchTerm));
        
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
        const isOnline = vehicle.last_position?.updatetime ? 
          new Date(vehicle.last_position.updatetime) > new Date(Date.now() - 30 * 60 * 1000) : 
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
  const statistics = useMemo(() => {
    const total = vehicles.length;
    const active = vehicles.filter(v => v.is_active).length;
    const online = vehicles.filter(v => {
      if (!v.last_position?.updatetime) return false;
      return new Date(v.last_position.updatetime) > new Date(Date.now() - 30 * 60 * 1000);
    }).length;
    const alerts = vehicles.filter(v => 
      v.status?.toLowerCase().includes('alert') || 
      v.status?.toLowerCase().includes('alarm')
    ).length;

    return { total, active, online, alerts };
  }, [vehicles]);

  const handleVehicleAction = {
    viewMap: (vehicle: Vehicle) => {
      console.log('View map for vehicle:', vehicle.device_id);
      // TODO: Implement map view
    },
    
    viewHistory: (vehicle: Vehicle) => {
      console.log('View history for vehicle:', vehicle.device_id);
      // TODO: Implement history view
    },
    
    viewDetails: (vehicle: Vehicle) => {
      console.log('View details for vehicle:', vehicle.device_id);
      // TODO: Implement details view
    },
    
    sendCommand: (vehicle: Vehicle) => {
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
