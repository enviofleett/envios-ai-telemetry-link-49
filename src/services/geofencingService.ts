
import { supabase } from '@/integrations/supabase/client';

export interface Geofence {
  id: string;
  created_by: string;
  name: string;
  description?: string;
  geometry: any; // GeoJSON geometry
  fence_type: 'inclusion' | 'exclusion';
  is_active: boolean;
  alert_on_enter: boolean;
  alert_on_exit: boolean;
  created_at: string;
  updated_at: string;
}

export interface GeofenceAlert {
  id: string;
  geofence_id: string;
  vehicle_id?: string;
  device_id: string;
  alert_type: 'enter' | 'exit';
  triggered_at: string;
  location: { lat: number; lng: number };
  is_acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  created_at: string;
}

class GeofencingService {
  async createGeofence(geofence: Omit<Geofence, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('geofences')
        .insert({
          name: geofence.name,
          description: geofence.description,
          geometry: geofence.geometry,
          fence_type: geofence.fence_type,
          is_active: geofence.is_active,
          alert_on_enter: geofence.alert_on_enter,
          alert_on_exit: geofence.alert_on_exit,
          created_by: geofence.created_by
        })
        .select()
        .single();

      if (error) throw error;
      return data as Geofence;
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
      return (data || []) as Geofence[];
    } catch (error) {
      console.error('Failed to fetch geofences:', error);
      return [];
    }
  }

  async updateGeofence(id: string, updates: Partial<Geofence>) {
    try {
      const { data, error } = await supabase
        .from('geofences')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Geofence;
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

  async getGeofenceAlerts(deviceId?: string): Promise<GeofenceAlert[]> {
    try {
      let query = supabase
        .from('geofence_alerts')
        .select(`
          *,
          geofences (name, description)
        `)
        .order('triggered_at', { ascending: false });

      if (deviceId) {
        query = query.eq('device_id', deviceId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as GeofenceAlert[];
    } catch (error) {
      console.error('Failed to fetch geofence alerts:', error);
      return [];
    }
  }

  async acknowledgeAlert(alertId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('geofence_alerts')
        .update({
          is_acknowledged: true,
          acknowledged_by: user?.id,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      throw error;
    }
  }

  // Helper function to check if a point is inside a polygon
  private isPointInPolygon(point: { lat: number; lng: number }, polygon: any): boolean {
    if (!polygon?.coordinates?.[0]) return false;
    
    const coordinates = polygon.coordinates[0];
    const x = point.lng;
    const y = point.lat;
    let inside = false;

    for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
      const xi = coordinates[i][0];
      const yi = coordinates[i][1];
      const xj = coordinates[j][0];
      const yj = coordinates[j][1];

      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }

    return inside;
  }

  async checkVehicleInGeofences(deviceId: string, lat: number, lng: number): Promise<GeofenceAlert[]> {
    const geofences = await this.getGeofences();
    const alerts: GeofenceAlert[] = [];

    for (const geofence of geofences) {
      const isInside = this.isPointInPolygon({ lat, lng }, geofence.geometry);
      
      // Check if this is a new entry/exit event
      const shouldAlert = (geofence.alert_on_enter && isInside) || (geofence.alert_on_exit && !isInside);
      
      if (shouldAlert) {
        try {
          // Get vehicle ID from device ID
          const { data: vehicle } = await supabase
            .from('vehicles')
            .select('id')
            .eq('gp51_device_id', deviceId)
            .single();

          const { data, error } = await supabase
            .from('geofence_alerts')
            .insert({
              geofence_id: geofence.id,
              vehicle_id: vehicle?.id,
              device_id: deviceId,
              alert_type: isInside ? 'enter' : 'exit',
              triggered_at: new Date().toISOString(),
              location: { lat, lng },
              is_acknowledged: false
            })
            .select()
            .single();

          if (!error && data) {
            alerts.push(data as GeofenceAlert);
          }
        } catch (error) {
          console.error('Failed to create geofence alert:', error);
        }
      }
    }

    return alerts;
  }
}

export const geofencingService = new GeofencingService();
