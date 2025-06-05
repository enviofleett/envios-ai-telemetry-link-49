
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Geofence } from '@/services/geofencing';

interface GeofenceFormModalProps {
  isOpen: boolean;
  editingGeofence: Geofence | null;
  onClose: () => void;
  onCreate: () => void;
  onUpdate: () => void;
}

const GeofenceFormModal: React.FC<GeofenceFormModalProps> = ({ 
  isOpen, 
  editingGeofence, 
  onClose, 
  onCreate, 
  onUpdate 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>
            {editingGeofence ? 'Edit Geofence' : 'Create Geofence'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Note: This is a simplified form. In a full implementation, you would include
            a map interface for drawing geofence boundaries.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={editingGeofence ? onUpdate : onCreate}>
              {editingGeofence ? 'Update' : 'Create'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeofenceFormModal;
