
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData } from '@/types/vehicle';

export const useStableEnhancedVehicleData = () => {
  return useQuery({
    queryKey: ['stable-enhanced-vehicles'],
    queryFn: async (): Promise<VehicleData[]> => {
      const { data: vehicles, error } = await supabase
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
        `);

      if (error) {
        console.error('Error fetching vehicles:', error);
        throw error;
      }

      return (vehicles || []).map(vehicle => ({
        id: vehicle.id,
        device_id: vehicle.gp51_device_id,
        gp51_device_id: vehicle.gp51_device_id, // Added missing property
        device_name: vehicle.name,
        name: vehicle.name,
        sim_number: vehicle.sim_number,
        user_id: vehicle.user_id,
        created_at: vehicle.created_at,
        updated_at: vehicle.updated_at,
        envio_users: vehicle.envio_users,
        status: Math.random() > 0.5 ? 'offline' : 'active',
        is_active: true,
        isOnline: Math.random() > 0.3,
        isMoving: Math.random() > 0.6,
        alerts: [],
        lastUpdate: new Date(),
        vin: undefined,
        license_plate: undefined,
        last_position: {
          latitude: 40.7128 + (Math.random() - 0.5) * 0.01,
          longitude: -74.0060 + (Math.random() - 0.5) * 0.01,
          speed: Math.floor(Math.random() * 80),
          course: Math.floor(Math.random() * 360),
          timestamp: new Date().toISOString()
        },
        speed: Math.floor(Math.random() * 80),
        course: Math.floor(Math.random() * 360),
        driver: Math.random() > 0.5 ? 'John Doe' : null,
        fuel: Math.floor(Math.random() * 100),
        mileage: Math.floor(Math.random() * 100000),
        plateNumber: `ABC-${Math.floor(Math.random() * 1000)}`,
        model: 'Fleet Vehicle',
        gp51_metadata: {},
        image_urls: [],
        fuel_tank_capacity_liters: 50,
        manufacturer_fuel_consumption_100km_l: 8.5,
        insurance_expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        license_expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        location: {
          latitude: 40.7128 + (Math.random() - 0.5) * 0.01,
          longitude: -74.0060 + (Math.random() - 0.5) * 0.01,
          address: '123 Main St, New York, NY'
        }
      }));
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchInterval: 1000 * 60 * 2,
  });
};
