
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Car, Clock, AlertCircle, Eye, Navigation } from 'lucide-react';
import type { VehicleData } from '@/types/vehicle';
import UserVehicleDetailsModal from './UserVehicleDetailsModal';

interface UserVehicle extends VehicleData {
  distance_from_last_position?: number;
  last_contact?: string;
}

const UserVehicleDashboard: React.FC = () => {
  const { user } = useAuth();
  const [selectedVehicle, setSelectedVehicle] = useState<UserVehicle | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { data: userVehicles = [], isLoading, error } = useQuery({
    queryKey: ['user-vehicles', user?.id],
    queryFn: async (): Promise<UserVehicle[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          id,
          gp51_device_id,
          name,
          sim_number,
          created_at,
          updated_at,
          envio_users (
            name,
            email
          )
        `)
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching user vehicles:', error);
        throw error;
      }

      return (data || []).map((vehicle): UserVehicle => ({
        id: vehicle.id,
        device_id: vehicle.gp51_device_id,
        device_name: vehicle.name,
        sim_number: vehicle.sim_number,
        user_id: user.id,
        created_at: vehicle.created_at,
        updated_at: vehicle.updated_at,
        envio_users: vehicle.envio_users,
        status: 'offline', // Default status since we don't have real-time data yet
        is_active: true,
        lastUpdate: new Date(vehicle.updated_at),
        isOnline: false,
        isMoving: false,
        alerts: [],
        last_contact: new Date(vehicle.updated_at).toLocaleString(),
      }));
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleViewDetails = (vehicle: UserVehicle) => {
    setSelectedVehicle(vehicle);
    setShowDetailsModal(true);
  };

  const handleTrackVehicle = (vehicle: UserVehicle) => {
    // Navigate to tracking page with this vehicle selected
    window.location.href = `/tracking?vehicle=${vehicle.device_id}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'idle': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'offline': return 'Offline';
      case 'idle': return 'Idle';
      default: return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your vehicles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load Vehicles</h3>
          <p className="text-muted-foreground">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  if (userVehicles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Vehicles Assigned</h3>
          <p className="text-muted-foreground">
            Contact your administrator to assign vehicles to your account
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Vehicles</h2>
          <p className="text-muted-foreground">
            {userVehicles.length} vehicle{userVehicles.length !== 1 ? 's' : ''} assigned to you
          </p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          <Clock className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Vehicle Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {userVehicles.map((vehicle) => (
          <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{vehicle.device_name}</CardTitle>
                <div className={`w-3 h-3 rounded-full ${getStatusColor(vehicle.status)}`} />
              </div>
              <CardDescription>
                Device ID: {vehicle.device_id}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={vehicle.status === 'online' ? 'default' : 'secondary'}>
                  {getStatusLabel(vehicle.status)}
                </Badge>
              </div>
              
              {vehicle.sim_number && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">SIM:</span>
                  <span className="font-mono text-xs">{vehicle.sim_number}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last Contact:</span>
                <span className="text-xs">{vehicle.last_contact}</span>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleViewDetails(vehicle)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Details
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => handleTrackVehicle(vehicle)}
                  className="flex-1"
                >
                  <Navigation className="h-4 w-4 mr-1" />
                  Track
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Vehicle Details Modal */}
      {selectedVehicle && (
        <UserVehicleDetailsModal
          vehicle={selectedVehicle}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedVehicle(null);
          }}
        />
      )}
    </div>
  );
};

export default UserVehicleDashboard;
