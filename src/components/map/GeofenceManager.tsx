
import React, { useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import type { Geofence } from '@/services/geofencing';

// Import the refactored components
import GeofenceHeader from './geofence/GeofenceHeader';
import GeofenceSummaryCards from './geofence/GeofenceSummaryCards';
import UnacknowledgedAlerts from './geofence/UnacknowledgedAlerts';
import GeofenceList from './geofence/GeofenceList';
import GeofenceFormModal from './geofence/GeofenceFormModal';
import { useGeofenceData } from './geofence/hooks/useGeofenceData';

const GeofenceManager: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGeofence, setEditingGeofence] = useState<Geofence | null>(null);

  const {
    geofences,
    alerts,
    isLoading,
    handleCreateGeofence,
    handleUpdateGeofence,
    handleDeleteGeofence,
    handleAcknowledgeAlert
  } = useGeofenceData();

  const unacknowledgedAlerts = alerts.filter(alert => !alert.is_acknowledged);

  const handleCreateClick = () => {
    setShowCreateForm(true);
  };

  const handleEditGeofence = (geofence: Geofence) => {
    setEditingGeofence(geofence);
  };

  const handleCloseModal = () => {
    setShowCreateForm(false);
    setEditingGeofence(null);
  };

  const handleCreate = async () => {
    // In a full implementation, this would use form data
    setShowCreateForm(false);
  };

  const handleUpdate = async () => {
    // In a full implementation, this would use form data
    setEditingGeofence(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <LoadingSpinner />
            <span className="ml-2">Loading geofencing data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <GeofenceHeader onCreateClick={handleCreateClick} />
      
      <GeofenceSummaryCards geofences={geofences} alerts={alerts} />

      {unacknowledgedAlerts.length > 0 && (
        <UnacknowledgedAlerts 
          alerts={unacknowledgedAlerts}
          onAcknowledgeAlert={handleAcknowledgeAlert}
        />
      )}

      <GeofenceList
        geofences={geofences}
        onCreateClick={handleCreateClick}
        onEditGeofence={handleEditGeofence}
        onDeleteGeofence={handleDeleteGeofence}
      />

      <GeofenceFormModal
        isOpen={showCreateForm || editingGeofence !== null}
        editingGeofence={editingGeofence}
        onClose={handleCloseModal}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />
    </div>
  );
};

export default GeofenceManager;
