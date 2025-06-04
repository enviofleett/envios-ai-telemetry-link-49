
import { useState, useMemo } from 'react';
import { Vehicle, FilterState } from '@/types/vehicle';

export const useVehicleFilters = (vehicles: Vehicle[]) => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    user: 'all',
    online: 'all'
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

  return {
    filters,
    setFilters,
    filteredVehicles,
    userOptions
  };
};
