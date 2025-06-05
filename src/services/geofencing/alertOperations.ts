
import { supabase } from '@/integrations/supabase/client';
import type { GeofenceAlert } from './types';

export class AlertOperations {
  async createGeofenceAlert(alert: Omit<GeofenceAlert, 'id'>): Promise<GeofenceAlert | null> {
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
      return data as unknown as GeofenceAlert;
    } catch (error) {
      console.error('Failed to create geofence alert:', error);
      return null;
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
      return (data || []) as unknown as GeofenceAlert[];
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
