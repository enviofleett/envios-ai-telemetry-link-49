
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Edit, Trash2 } from 'lucide-react';
import type { Geofence } from '@/services/geofencing';

interface GeofenceListProps {
  geofences: Geofence[];
  onCreateClick: () => void;
  onEditGeofence: (geofence: Geofence) => void;
  onDeleteGeofence: (id: string) => void;
}

const GeofenceList: React.FC<GeofenceListProps> = ({ 
  geofences, 
  onCreateClick, 
  onEditGeofence, 
  onDeleteGeofence 
}) => {
  if (geofences.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Geofences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Geofences</h3>
            <p className="text-gray-600 mb-4">
              Create your first geofence to start monitoring vehicle boundaries
            </p>
            <Button onClick={onCreateClick}>
              <Plus className="h-4 w-4 mr-2" />
              Create Geofence
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Geofences</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {geofences.map((geofence) => (
            <div key={geofence.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{geofence.name}</h3>
                    <Badge variant={geofence.is_active ? "default" : "secondary"}>
                      {geofence.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline" className={
                      geofence.fence_type === 'inclusion' ? 'text-green-600' : 'text-red-600'
                    }>
                      {geofence.fence_type}
                    </Badge>
                  </div>
                  
                  {geofence.description && (
                    <p className="text-sm text-gray-600 mb-2">{geofence.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>
                      Alert on Enter: {geofence.alert_on_enter ? 'Yes' : 'No'}
                    </span>
                    <span>
                      Alert on Exit: {geofence.alert_on_exit ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditGeofence(geofence)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteGeofence(geofence.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default GeofenceList;
