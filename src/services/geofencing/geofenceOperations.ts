
import { supabase } from '@/integrations/supabase/client';
import type { Geofence } from './types';

export class GeofenceOperations {
  async createGeofence(geofence: Omit<Geofence, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('geofences')
        .insert({
          name: geofence.name,
          description: geofence.description,
          geometry: geofence.geometry as any,
          fence_type: geofence.fence_type,
          is_active: geofence.is_active,
          alert_on_enter: geofence.alert_on_enter,
          alert_on_exit: geofence.alert_on_exit,
          created_by: geofence.created_by
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Geofence;
    } catch (error) {
      console.error('Failed to create geofence:', error);
      throw error;
    }
  }

  async getGeofences(): Promise<Geofence[]> {
    try {
      const { data, error } = await supabase
        .from('geofences')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as Geofence[];
    } catch (error) {
      console.error('Failed to fetch geofences:', error);
      return [];
    }
  }

  async updateGeofence(id: string, updates: Partial<Geofence>) {
    try {
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      // Convert geometry if present
      if (updates.geometry) {
        updateData.geometry = updates.geometry as any;
      }

      const { data, error } = await supabase
        .from('geofences')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Geofence;
    } catch (error) {
      console.error('Failed to update geofence:', error);
      throw error;
    }
  }

  async deleteGeofence(id: string) {
    try {
      const { error } = await supabase
        .from('geofences')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete geofence:', error);
      throw error;
    }
  }
}
