
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, MapPin, Battery, Signal } from 'lucide-react';

const UserVehicles: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Vehicles</h1>
        <p className="text-gray-600">View and manage vehicles assigned to you</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">No Vehicles Assigned</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-12">
            <Car className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">You don't have any vehicles assigned yet</p>
            <p className="text-sm text-gray-500">Contact your administrator to assign vehicles to your account</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserVehicles;
