
import { supabase } from '@/integrations/supabase/client';

export interface Geofence {
  id: string;
  name: string;
  description?: string;
  geometry: any; // Using any for GeoJSON compatibility
  fence_type: 'inclusion' | 'exclusion';
  is_active: boolean;
  alert_on_enter: boolean;
  alert_on_exit: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface GeofenceAlert {
  id: string;
  geofence_id: string;
  device_id: string;
  alert_type: 'enter' | 'exit';
  triggered_at: string;
  location: { lat: number; lng: number };
  is_acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
}

// Type guard to safely convert JSON location to our expected format
function isValidLocation(location: any): location is { lat: number; lng: number } {
  return (
    typeof location === 'object' &&
    location !== null &&
    typeof location.lat === 'number' &&
    typeof location.lng === 'number'
  );
}

// Helper function to safely convert Supabase data to GeofenceAlert
function convertToGeofenceAlert(data: any): GeofenceAlert | null {
  if (!data || !isValidLocation(data.location)) {
    console.warn('Invalid geofence alert data:', data);
    return null;
  }

  return {
    id: data.id,
    geofence_id: data.geofence_id,
    device_id: data.device_id,
    alert_type: data.alert_type,
    triggered_at: data.triggered_at,
    location: data.location,
    is_acknowledged: data.is_acknowledged,
    acknowledged_by: data.acknowledged_by,
    acknowledged_at: data.acknowledged_at
  };
}

class GeofencingService {
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

  async checkVehicleInGeofences(deviceId: string, lat: number, lng: number): Promise<GeofenceAlert[]> {
    const geofences = await this.getGeofences();
    const alerts: GeofenceAlert[] = [];

    for (const geofence of geofences) {
      const isInside = this.isPointInPolygon({ lat, lng }, geofence.geometry);
      
      // Check if this is a new entry/exit event
      const shouldAlert = (geofence.alert_on_enter && isInside) || (geofence.alert_on_exit && !isInside);
      
      if (shouldAlert) {
        const alert = await this.createGeofenceAlert({
          geofence_id: geofence.id,
          device_id: deviceId,
          alert_type: isInside ? 'enter' : 'exit',
          triggered_at: new Date().toISOString(),
          location: { lat, lng },
          is_acknowledged: false
        });
        
        if (alert) alerts.push(alert);
      }
    }

    return alerts;
  }

  private async createGeofenceAlert(alert: Omit<GeofenceAlert, 'id'>): Promise<GeofenceAlert | null> {
    try {
      const { data, error } = await supabase
        .from('geofence_alerts')
        .insert({
          geofence_id: alert.geofence_id,
          device_id: alert.device_id,
          alert_type: alert.alert_type,
          triggered_at: alert.triggered_at,
          location: alert.location as any,
          is_acknowledged: alert.is_acknowledged
        })
        .select()
        .single();

      if (error) throw error;
      return convertToGeofenceAlert(data);
    } catch (error) {
      console.error('Failed to create geofence alert:', error);
      return null;
    }
  }

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
      
      // Safely convert the data to GeofenceAlert[]
      const alerts: GeofenceAlert[] = [];
      if (data) {
        for (const item of data) {
          const alert = convertToGeofenceAlert(item);
          if (alert) {
            alerts.push(alert);
          }
        }
      }
      
      return alerts;
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
}

export const geofencingService = new GeofencingService();
