
import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import DynamicMap from '@/components/map/DynamicMap';
import VehicleListPanel from '@/components/tracking/VehicleListPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  MapPin, 
  Activity, 
  AlertTriangle, 
  RefreshCw,
  Eye,
  EyeOff,
  Maximize2
} from 'lucide-react';
import { useStableVehicleData } from '@/hooks/useStableVehicleData';
import { loadMockVehicleDataForMap } from '@/services/unifiedVehicleData/dataLoader';
import type { VehicleData } from '@/services/unifiedVehicleData';

const LiveTracking: React.FC = () => {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [mapVehicles, setMapVehicles] = useState<VehicleData[]>([]);
  const [vehicleAddresses, setVehicleAddresses] = useState<Map<string, string>>(new Map());
  const [showVehicleList, setShowVehicleList] = useState(true);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  // Use stable vehicle data hook with proper property names
  const { vehicles, metrics, isLoading, forceRefresh } = useStableVehicleData({
    refetchInterval: 30000,
    search: '',
    status: 'all'
  });

  // Filter for vehicles with valid positions
  const vehiclesWithPositions = useMemo(() => {
    return vehicles.filter(vehicle => 
      vehicle.last_position?.lat && 
      vehicle.last_position?.lng
    );
  }, [vehicles]);

  // Load map-specific vehicles on mount
  useEffect(() => {
    const mockMapVehicles = loadMockVehicleDataForMap();
    setMapVehicles(mockMapVehicles);

    // Generate mock addresses
    const addresses = new Map<string, string>();
    mockMapVehicles.forEach((vehicle, index) => {
      const mockAddresses = [
        '123 Broadway, New York, NY',
        '456 Fifth Avenue, New York, NY',
        '789 Madison Avenue, New York, NY',
        '321 Park Avenue, New York, NY',
        '654 Lexington Avenue, New York, NY'
      ];
      addresses.set(vehicle.device_id, mockAddresses[index % mockAddresses.length]);
    });
    setVehicleAddresses(addresses);
  }, []);

  // Combine vehicles for map display (real + mock)
  const allMapVehicles = useMemo(() => {
    const combinedVehicles = [...vehiclesWithPositions, ...mapVehicles];
    return combinedVehicles.map(vehicle => ({
      id: vehicle.device_id,
      lat: vehicle.last_position?.lat || 0,
      lng: vehicle.last_position?.lng || 0,
      name: vehicle.device_name || vehicle.device_id,
      status: vehicle.status || 'offline',
      speed: vehicle.last_position?.speed || 0,
      lastUpdate: vehicle.lastUpdate || new Date(),
      course: vehicle.last_position?.course || 0,
      isSelected: selectedVehicle?.device_id === vehicle.device_id
    }));
  }, [vehiclesWithPositions, mapVehicles, selectedVehicle]);

  // Calculate enhanced metrics
  const enhancedMetrics = useMemo(() => {
    const allVehicles = [...vehicles, ...mapVehicles];
    const now = new Date();
    
    const online = allVehicles.filter(v => {
      if (!v.last_position?.timestamp) return false;
      const lastUpdate = new Date(v.last_position.timestamp);
      return (now.getTime() - lastUpdate.getTime()) < (5 * 60 * 1000); // 5 minutes
    }).length;
    
    const moving = allVehicles.filter(v => v.last_position?.speed && v.last_position.speed > 5).length;
    const idle = online - moving;
    const offline = allVehicles.length - online;

    return {
      total: allVehicles.length,
      online,
      moving,
      idle,
      offline,
      alerts: allVehicles.reduce((sum, v) => sum + (v.alerts?.length || 0), 0)
    };
  }, [vehicles, mapVehicles]);

  const handleVehicleSelect = (vehicle: VehicleData) => {
    setSelectedVehicle(vehicle);
  };

  const handleMapVehicleClick = (vehicleId: string) => {
    const allVehicles = [...vehicles, ...mapVehicles];
    const vehicle = allVehicles.find(v => v.device_id === vehicleId);
    if (vehicle) {
      setSelectedVehicle(vehicle);
    }
  };

  const handleRefreshAddresses = async () => {
    // Mock refresh - in real app would geocode positions
    console.log('Refreshing addresses...');
    await forceRefresh();
  };

  const handleTripHistory = (vehicle: VehicleData) => {
    console.log('Opening trip history for:', vehicle.device_name);
    // TODO: Implement trip history modal
  };

  const handleSendAlert = (vehicle: VehicleData) => {
    console.log('Sending alert to:', vehicle.device_name);
    // TODO: Implement alert sending
  };

  const toggleVehicleList = () => {
    setShowVehicleList(!showVehicleList);
  };

  const toggleMapFullscreen = () => {
    setIsMapFullscreen(!isMapFullscreen);
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="h-full flex flex-col space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Live Tracking</h1>
                <p className="text-sm text-muted-foreground">
                  Real-time vehicle monitoring and location tracking
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleVehicleList}
                className="flex items-center gap-2"
              >
                {showVehicleList ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showVehicleList ? 'Hide' : 'Show'} Vehicle List
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={toggleMapFullscreen}
                className="flex items-center gap-2"
              >
                <Maximize2 className="h-4 w-4" />
                {isMapFullscreen ? 'Exit' : 'Fullscreen'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={forceRefresh}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Total</span>
                </div>
                <div className="text-2xl font-bold mt-1">{enhancedMetrics.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Online</span>
                </div>
                <div className="text-2xl font-bold mt-1 text-green-600">{enhancedMetrics.online}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Moving</span>
                </div>
                <div className="text-2xl font-bold mt-1 text-blue-600">{enhancedMetrics.moving}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium">Idle</span>
                </div>
                <div className="text-2xl font-bold mt-1 text-yellow-600">{enhancedMetrics.idle}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span className="text-sm font-medium">Offline</span>
                </div>
                <div className="text-2xl font-bold mt-1 text-gray-600">{enhancedMetrics.offline}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">Alerts</span>
                </div>
                <div className="text-2xl font-bold mt-1 text-red-600">{enhancedMetrics.alerts}</div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className={`flex-1 flex gap-6 ${isMapFullscreen ? 'fixed inset-0 z-50 bg-white p-6' : ''}`}>
            {/* Vehicle List Panel */}
            {showVehicleList && !isMapFullscreen && (
              <div className="w-80 flex-shrink-0">
                <VehicleListPanel
                  selectedVehicle={selectedVehicle}
                  onVehicleSelect={handleVehicleSelect}
                  vehicleAddresses={vehicleAddresses}
                  onTripHistory={handleTripHistory}
                  onSendAlert={handleSendAlert}
                  onRefreshAddresses={handleRefreshAddresses}
                />
              </div>
            )}

            {/* Map Container */}
            <div className="flex-1 min-h-0">
              <Card className="h-full">
                <CardHeader className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">
                      Live Map View
                    </CardTitle>
                    
                    {selectedVehicle && (
                      <Badge variant="outline" className="text-sm">
                        Selected: {selectedVehicle.device_name || selectedVehicle.device_id}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="p-0 h-full">
                  <div className="h-full min-h-[400px]">
                    <DynamicMap
                      vehicles={allMapVehicles}
                      onVehicleClick={handleMapVehicleClick}
                      selectedVehicleId={selectedVehicle?.device_id}
                      showTrafficLayer={true}
                      className="w-full h-full rounded-b-lg"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Selected Vehicle Details */}
          {selectedVehicle && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {selectedVehicle.device_name || selectedVehicle.device_id} Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <div className="font-medium">
                      <Badge variant={selectedVehicle.status === 'online' ? 'default' : 'secondary'}>
                        {selectedVehicle.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Speed:</span>
                    <div className="font-medium">
                      {selectedVehicle.last_position?.speed || 0} km/h
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Last Update:</span>
                    <div className="font-medium">
                      {selectedVehicle.last_position?.timestamp 
                        ? new Date(selectedVehicle.last_position.timestamp).toLocaleTimeString()
                        : 'N/A'
                      }
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Location:</span>
                    <div className="font-medium">
                      {vehicleAddresses.get(selectedVehicle.device_id) || 'Unknown'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default LiveTracking;
