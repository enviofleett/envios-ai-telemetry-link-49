
import { useState, useEffect } from 'react';
import { geofencingService, type Geofence, type GeofenceAlert } from '@/services/geofencing';
import { toast } from 'sonner';

export const useGeofenceData = () => {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [alerts, setAlerts] = useState<GeofenceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [geofencesData, alertsData] = await Promise.all([
        geofencingService.getGeofences(),
        geofencingService.getGeofenceAlerts()
      ]);
      setGeofences(geofencesData);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Failed to load geofencing data:', error);
      toast.error('Failed to load geofencing data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateGeofence = async (geofenceData: Omit<Geofence, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await geofencingService.createGeofence(geofenceData);
      toast.success('Geofence created successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to create geofence');
    }
  };

  const handleUpdateGeofence = async (id: string, updates: Partial<Geofence>) => {
    try {
      await geofencingService.updateGeofence(id, updates);
      toast.success('Geofence updated successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to update geofence');
    }
  };

  const handleDeleteGeofence = async (id: string) => {
    if (!confirm('Are you sure you want to delete this geofence?')) return;
    
    try {
      await geofencingService.deleteGeofence(id);
      toast.success('Geofence deleted successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to delete geofence');
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await geofencingService.acknowledgeAlert(alertId);
      toast.success('Alert acknowledged');
      loadData();
    } catch (error) {
      toast.error('Failed to acknowledge alert');
    }
  };

  return {
    geofences,
    alerts,
    isLoading,
    loadData,
    handleCreateGeofence,
    handleUpdateGeofence,
    handleDeleteGeofence,
    handleAcknowledgeAlert
  };
};
