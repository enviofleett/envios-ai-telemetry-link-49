
import { supabase } from '@/integrations/supabase/client';
import type { Vehicle } from './types';

export class VehicleDataLoader {
  public async loadVehiclesFromDatabase(): Promise<{ vehicles: Vehicle[], totalCount: number }> {
    try {
      // Get total count of active vehicles first
      const { count: totalCount, error: countError } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (countError) throw countError;
      
      console.log(`Total active vehicles in database: ${totalCount || 0}`);

      // Load vehicle data with position information
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const vehicles = (data || []).map(vehicle => ({
        deviceid: vehicle.device_id,
        devicename: vehicle.device_name,
        status: vehicle.status,
        envio_user_id: vehicle.envio_user_id,
        is_active: vehicle.is_active,
        lastPosition: this.parseLastPosition(vehicle.last_position)
      }));

      console.log(`Loaded ${vehicles.length} vehicles with position data from database`);
      return { vehicles, totalCount: totalCount || 0 };
    } catch (error) {
      console.error('Failed to load vehicles from database:', error);
      throw error;
    }
  }

  private parseLastPosition(lastPosition: any): Vehicle['lastPosition'] {
    if (!lastPosition || typeof lastPosition !== 'object') return undefined;
    
    return {
      lat: lastPosition.lat || 0,
      lon: lastPosition.lon || 0,
      speed: lastPosition.speed || 0,
      course: lastPosition.course || 0,
      updatetime: lastPosition.updatetime || '',
      statusText: lastPosition.statusText || ''
    };
  }
}
