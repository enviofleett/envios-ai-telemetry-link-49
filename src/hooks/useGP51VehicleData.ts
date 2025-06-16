
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData, VehicleLocation, VehicleDbRecord } from '@/types/vehicle';

interface GP51VehicleFilters {
  search?: string;
  status?: string;
  user?: string;
}

const createVehicleLocation = (lat: number, lon: number): VehicleLocation => ({
  latitude: lat,
  longitude: lon
});

// Helper function to map database records to VehicleData
const mapDbToVehicleData = (dbRecord: VehicleDbRecord): VehicleData => {
  return {
    id: dbRecord.id,
    device_id: dbRecord.gp51_device_id,
    device_name: dbRecord.name,
    user_id: dbRecord.user_id,
    sim_number: dbRecord.sim_number,
    created_at: dbRecord.created_at,
    updated_at: dbRecord.updated_at,
    status: 'offline', // Default status since not in DB
    is_active: true, // Default value
    isOnline: false,
    isMoving: false,
    alerts: [],
    lastUpdate: new Date(dbRecord.updated_at),
  };
};

export const useGP51VehicleData = (filters?: GP51VehicleFilters) => {
  const [page, setPage] = useState(0);
  const [allVehicles, setAllVehicles] = useState<VehicleData[]>([]);

  // Fetch vehicles from database using correct column names
  const { data: dbVehicles = [], isLoading, error, refetch } = useQuery({
    queryKey: ['gp51-vehicles', filters],
    queryFn: async (): Promise<VehicleData[]> => {
      console.log('Fetching GP51 vehicles with filters:', filters);
      
      let query = supabase
        .from('vehicles')
        .select('id, gp51_device_id, name, user_id, sim_number, created_at, updated_at')
        .order('updated_at', { ascending: false });

      // Apply search filter
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,gp51_device_id.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching vehicles:', error);
        throw error;
      }

      if (!data) {
        return [];
      }

      // Transform database records to VehicleData
      const dbRecords: VehicleDbRecord[] = data;
      return dbRecords.map(mapDbToVehicleData);
    },
    refetchInterval: 30000,
  });

  // Get active vehicles
  const getActiveVehicles = useCallback(() => {
    if (!dbVehicles) return [];
    
    return dbVehicles.filter(vehicle => {
      // Apply filters
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = 
          vehicle.device_name.toLowerCase().includes(searchTerm) ||
          vehicle.device_id.toLowerCase().includes(searchTerm);
        if (!matchesSearch) return false;
      }

      if (filters?.status && filters.status !== 'all') {
        if (filters.status === 'online' && !vehicle.isOnline) return false;
        if (filters.status === 'offline' && vehicle.isOnline) return false;
      }

      if (filters?.user && filters.user !== 'all') {
        if (vehicle.user_id !== filters.user) return false;
      }

      return true;
    });
  }, [dbVehicles, filters]);

  // Get inactive vehicles
  const getInactiveVehicles = useCallback(() => {
    if (!dbVehicles) return [];
    
    return dbVehicles.filter(vehicle => {
      // Apply filters similar to active vehicles
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = 
          vehicle.device_name.toLowerCase().includes(searchTerm) ||
          vehicle.device_id.toLowerCase().includes(searchTerm);
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [dbVehicles, filters]);

  // Get all vehicles (combined)
  const getAllVehicles = useCallback(() => {
    if (!dbVehicles) return [];
    
    return dbVehicles.filter(vehicle => {
      // Apply filters
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = 
          vehicle.device_name.toLowerCase().includes(searchTerm) ||
          vehicle.device_id.toLowerCase().includes(searchTerm);
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [dbVehicles, filters]);

  // Find vehicle by ID
  const findVehicleById = useCallback((id: string) => {
    if (!dbVehicles) return undefined;
    return dbVehicles.find(vehicle => vehicle.device_id === id);
  }, [dbVehicles]);

  // Load more data (pagination)
  const loadMore = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters: GP51VehicleFilters) => {
    // Trigger refetch with new filters
    refetch();
  }, [refetch]);

  // Get metrics
  const getMetrics = useCallback(() => {
    if (!dbVehicles) return { total: 0, active: 0, inactive: 0 };
    
    const total = dbVehicles.length;
    const active = dbVehicles.filter(v => v.is_active).length;
    const inactive = total - active;

    return { total, active, inactive };
  }, [dbVehicles]);

  return {
    vehicles: dbVehicles || [],
    isLoading,
    error: error?.message || null,
    refetch,
    page,
    setPage,
    loadMore,
    updateFilters,
    getActiveVehicles,
    getInactiveVehicles,
    getAllVehicles,
    findVehicleById,
    getMetrics,
  };
};

export default useGP51VehicleData;
