
import { supabase } from '@/integrations/supabase/client';
import type { Vehicle } from './types';

export class VehicleDataLoader {
  private readonly CHUNK_SIZE = 2000; // Load vehicles in chunks of 2000

  public async loadVehiclesFromDatabase(): Promise<{ vehicles: Vehicle[], totalCount: number }> {
    try {
      // Get total count of active vehicles first
      const { count: totalCount, error: countError } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (countError) throw countError;
      
      console.log(`Total active vehicles in database: ${totalCount || 0}`);

      // Load ALL vehicles in chunks instead of limiting to 1000
      const allVehicles: Vehicle[] = [];
      let offset = 0;
      
      while (offset < (totalCount || 0)) {
        console.log(`Loading vehicles chunk: ${offset} to ${offset + this.CHUNK_SIZE}`);
        
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('is_active', true)
          .order('updated_at', { ascending: false })
          .range(offset, offset + this.CHUNK_SIZE - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          const chunkVehicles = data.map(vehicle => ({
            deviceid: vehicle.device_id,
            devicename: vehicle.device_name,
            status: vehicle.status,
            envio_user_id: vehicle.envio_user_id,
            is_active: vehicle.is_active,
            lastPosition: this.parseLastPosition(vehicle.last_position)
          }));

          allVehicles.push(...chunkVehicles);
          console.log(`Loaded chunk: ${chunkVehicles.length} vehicles, total so far: ${allVehicles.length}`);
        }

        offset += this.CHUNK_SIZE;
        
        // Add small delay between chunks to avoid overwhelming the database
        if (offset < (totalCount || 0)) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`Completed loading all ${allVehicles.length} vehicles from database`);
      return { vehicles: allVehicles, totalCount: totalCount || 0 };
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

  // New method to prioritize vehicles that need position updates
  public async getVehiclesNeedingPositionUpdates(): Promise<Vehicle[]> {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('is_active', true)
        .or(`last_position->updatetime.is.null,last_position->updatetime.lt.${twentyFourHoursAgo.toISOString()}`)
        .order('updated_at', { ascending: true }) // Oldest first
        .limit(1000); // Prioritize first 1000 vehicles without recent updates

      if (error) throw error;

      const vehicles = (data || []).map(vehicle => ({
        deviceid: vehicle.device_id,
        devicename: vehicle.device_name,
        status: vehicle.status,
        envio_user_id: vehicle.envio_user_id,
        is_active: vehicle.is_active,
        lastPosition: this.parseLastPosition(vehicle.last_position)
      }));

      console.log(`Found ${vehicles.length} vehicles needing position updates`);
      return vehicles;
    } catch (error) {
      console.error('Failed to get vehicles needing updates:', error);
      return [];
    }
  }
}
