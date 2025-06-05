
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface GeofenceHeaderProps {
  onCreateClick: () => void;
}

const GeofenceHeader: React.FC<GeofenceHeaderProps> = ({ onCreateClick }) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Geofence Management</h2>
        <p className="text-gray-600">Manage geographical boundaries and alerts</p>
      </div>
      <Button onClick={onCreateClick}>
        <Plus className="h-4 w-4 mr-2" />
        Create Geofence
      </Button>
    </div>
  );
};

export default GeofenceHeader;
