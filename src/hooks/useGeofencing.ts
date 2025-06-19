
import { useState, useEffect, useCallback } from 'react';
import { geofencingService, type Geofence, type GeofenceAlert } from '@/services/geofencingService';
import { useToast } from '@/hooks/use-toast';

export const useGeofencing = () => {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [alerts, setAlerts] = useState<GeofenceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadGeofences = useCallback(async () => {
    try {
      const data = await geofencingService.getGeofences();
      setGeofences(data);
    } catch (error) {
      console.error('Failed to load geofences:', error);
    }
  }, []);

  const loadAlerts = useCallback(async () => {
    try {
      const data = await geofencingService.getGeofenceAlerts();
      setAlerts(data);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  }, []);

  const checkVehicleGeofences = useCallback(async (deviceId: string, lat: number, lng: number) => {
    try {
      const newAlerts = await geofencingService.checkVehicleInGeofences(deviceId, lat, lng);
      if (newAlerts.length > 0) {
        // Show toast notification for new alerts
        newAlerts.forEach(alert => {
          toast({
            title: "Geofence Alert",
            description: `Vehicle ${deviceId} has ${alert.alert_type === 'enter' ? 'entered' : 'exited'} a geofence`,
            variant: alert.alert_type === 'enter' ? 'default' : 'destructive'
          });
        });
        
        // Reload alerts to show new ones
        loadAlerts();
      }
    } catch (error) {
      console.error('Failed to check geofences:', error);
    }
  }, [toast, loadAlerts]);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      await geofencingService.acknowledgeAlert(alertId);
      toast({
        title: "Success",
        description: "Alert acknowledged successfully"
      });
      loadAlerts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to acknowledge alert",
        variant: "destructive"
      });
    }
  }, [toast, loadAlerts]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([loadGeofences(), loadAlerts()]);
      setIsLoading(false);
    };

    loadData();
  }, [loadGeofences, loadAlerts]);

  return {
    geofences,
    alerts,
    isLoading,
    loadGeofences,
    loadAlerts,
    checkVehicleGeofences,
    acknowledgeAlert
  };
};
