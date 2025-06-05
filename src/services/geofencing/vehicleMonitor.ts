
import type { Geofence, GeofenceAlert } from './types';
import { GeofenceOperations } from './geofenceOperations';
import { AlertOperations } from './alertOperations';
import { GeometryUtils } from './geometryUtils';

export class VehicleMonitor {
  private geofenceOps: GeofenceOperations;
  private alertOps: AlertOperations;

  constructor() {
    this.geofenceOps = new GeofenceOperations();
    this.alertOps = new AlertOperations();
  }

  async checkVehicleInGeofences(deviceId: string, lat: number, lng: number): Promise<GeofenceAlert[]> {
    const geofences = await this.geofenceOps.getGeofences();
    const alerts: GeofenceAlert[] = [];

    for (const geofence of geofences) {
      const isInside = GeometryUtils.isPointInPolygon({ lat, lng }, geofence.geometry);
      
      // Check if this is a new entry/exit event
      const shouldAlert = (geofence.alert_on_enter && isInside) || (geofence.alert_on_exit && !isInside);
      
      if (shouldAlert) {
        const alert = await this.alertOps.createGeofenceAlert({
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
}
