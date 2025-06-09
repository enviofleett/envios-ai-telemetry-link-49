
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

const GeofencingTab: React.FC = () => {
  return (
    <div className="space-y-4 mt-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Geofencing Management</h3>
        <p className="text-sm text-gray-600 mb-4">
          Create and manage geographical boundaries with real-time vehicle monitoring
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Geofencing Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Geofencing Coming Soon</h3>
              <p className="text-gray-500">
                Geofencing management will be available after map restructuring
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeofencingTab;
