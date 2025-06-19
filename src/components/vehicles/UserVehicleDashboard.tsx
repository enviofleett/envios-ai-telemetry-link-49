
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Eye, Navigation, Clock, Search } from 'lucide-react';
import { useRealtimeVehicleData } from '@/hooks/useRealtimeVehicleData';
import UserVehicleDetailsModal from './UserVehicleDetailsModal';
import EnhancedVehicleSearch from './EnhancedVehicleSearch';
import RealtimeMapTilerMap from '@/components/map/RealtimeMapTilerMap';
import type { VehicleData } from '@/types/vehicle';

const UserVehicleDashboard: React.FC = () => {
  const { vehicles, isLoading, error, isConnected } = useRealtimeVehicleData();
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filteredVehicles, setFilteredVehicles] = useState<VehicleData[]>([]);

  const handleViewDetails = (vehicle: VehicleData) => {
    setSelectedVehicle(vehicle);
    setShowDetailsModal(true);
  };

  const handleTrackVehicle = (vehicle: VehicleData) => {
    window.location.href = `/tracking?vehicle=${vehicle.device_id}`;
  };

  const handleVehicleSelect = (vehicle: VehicleData) => {
    setSelectedVehicle(vehicle);
  };

  const getStatusColor = (vehicle: VehicleData) => {
    if (vehicle.isMoving) return 'bg-green-500';
    if (vehicle.isOnline) return 'bg-blue-500';
    return 'bg-red-500';
  };

  const getStatusLabel = (vehicle: VehicleData) => {
    if (vehicle.isMoving) return 'Moving';
    if (vehicle.isOnline) return 'Online';
    return 'Offline';
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
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Navigation className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} assigned to you
            </span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>{isConnected ? 'Live Updates' : 'Disconnected'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <EnhancedVehicleSearch
        vehicles={vehicles}
        onFilteredVehicles={setFilteredVehicles}
      />

      {/* Real-time Map */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Locations</CardTitle>
          <CardDescription>
            Real-time vehicle positions and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RealtimeMapTilerMap
            height="400px"
            onVehicleSelect={handleVehicleSelect}
            selectedVehicle={selectedVehicle}
            autoFitBounds
          />
        </CardContent>
      </Card>

      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVehicles.map((vehicle) => (
          <Card 
            key={vehicle.id} 
            className={`hover:shadow-lg transition-shadow ${
              selectedVehicle?.id === vehicle.id ? 'ring-2 ring-primary' : ''
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{vehicle.device_name}</CardTitle>
                <div className={`w-3 h-3 rounded-full ${getStatusColor(vehicle)}`} />
              </div>
              <CardDescription>
                Device ID: {vehicle.device_id}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={vehicle.isOnline ? 'default' : 'secondary'}>
                  {getStatusLabel(vehicle)}
                </Badge>
              </div>
              
              {vehicle.sim_number && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">SIM:</span>
                  <span className="font-mono text-xs">{vehicle.sim_number}</span>
                </div>
              )}

              {vehicle.last_position && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Speed:</span>
                  <span>{Math.round(vehicle.last_position.speed || 0)} km/h</span>
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last Update:</span>
                <span className="text-xs">
                  {vehicle.lastUpdate.toLocaleTimeString()}
                </span>
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
