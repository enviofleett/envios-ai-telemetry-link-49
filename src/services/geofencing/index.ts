
import { GeofenceOperations } from './geofenceOperations';
import { AlertOperations } from './alertOperations';
import { VehicleMonitor } from './vehicleMonitor';
import { GeometryUtils } from './geometryUtils';

export type { Geofence, GeofenceAlert } from './types';

class GeofencingService {
  private geofenceOps: GeofenceOperations;
  private alertOps: AlertOperations;
  private vehicleMonitor: VehicleMonitor;

  constructor() {
    this.geofenceOps = new GeofenceOperations();
    this.alertOps = new AlertOperations();
    this.vehicleMonitor = new VehicleMonitor();
  }

  // Geofence operations
  async createGeofence(geofence: Parameters<GeofenceOperations['createGeofence']>[0]) {
    return this.geofenceOps.createGeofence(geofence);
  }

  async getGeofences() {
    return this.geofenceOps.getGeofences();
  }

  async updateGeofence(id: string, updates: Parameters<GeofenceOperations['updateGeofence']>[1]) {
    return this.geofenceOps.updateGeofence(id, updates);
  }

  async deleteGeofence(id: string) {
    return this.geofenceOps.deleteGeofence(id);
  }

  // Alert operations
  async getGeofenceAlerts(deviceId?: string) {
    return this.alertOps.getGeofenceAlerts(deviceId);
  }

  async acknowledgeAlert(alertId: string) {
    return this.alertOps.acknowledgeAlert(alertId);
  }

  // Vehicle monitoring
  async checkVehicleInGeofences(deviceId: string, lat: number, lng: number) {
    return this.vehicleMonitor.checkVehicleInGeofences(deviceId, lat, lng);
  }

  // Utility methods
  static isPointInPolygon(point: { lat: number; lng: number }, polygon: any) {
    return GeometryUtils.isPointInPolygon(point, polygon);
  }
}

export const geofencingService = new GeofencingService();
export { GeofenceOperations, AlertOperations, VehicleMonitor, GeometryUtils };
