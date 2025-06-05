
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
