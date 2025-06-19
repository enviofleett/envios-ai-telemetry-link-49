
import React, { useState, useCallback, useMemo } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Navigation, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Activity,
  MapPin,
  Route,
  Settings
} from 'lucide-react';
import { useStableEnhancedVehicleData } from '@/hooks/useStableEnhancedVehicleData';
import { useEnhancedRealtimeVehicleData } from '@/hooks/useEnhancedRealtimeVehicleData';
import MapTilerMap from '@/components/map/MapTilerMap';
import LiveTrackingFilters from './LiveTrackingFilters';
import LiveTrackingStats from './LiveTrackingStats';
import VehicleListPanel from './VehicleListPanel';
import type { VehicleData } from '@/types/vehicle';

const EnhancedLiveTrackingPage: React.FC = () => {
  // UI state
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [showTrails, setShowTrails] = useState(true);
  const [enableWebSocket, setEnableWebSocket] = useState(true);
  const [trailHours, setTrailHours] = useState(6);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Get base vehicle data
  const {
    vehicles: baseVehicles,
    filteredVehicles,
    statistics,
    isLoading: isLoadingVehicles,
    error: vehicleError,
    refetch: refetchVehicles,
    setFilters,
    userOptions
  } = useStableEnhancedVehicleData();

  // Enhanced real-time data
  const {
    vehicles: enhancedVehicles,
    vehicleTrails,
    isLoadingTrails,
    realtimeStats,
    connectionState,
    error: realtimeError,
    isWebSocketConnected,
    refreshPositions,
    getVehicleTrail,
    forceRefreshTrails
  } = useEnhancedRealtimeVehicleData(filteredVehicles, {
    enableWebSocket,
    enableTrails: showTrails,
    trailHours,
    fallbackPollingInterval: autoRefresh ? 30000 : 0
  });

  // Memoized connection status
  const connectionStatus = useMemo(() => {
    switch (connectionState) {
      case 'connected':
        return { 
          icon: Wifi, 
          text: 'Connected', 
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        };
      case 'connecting':
        return { 
          icon: RefreshCw, 
          text: 'Connecting...', 
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100'
        };
      case 'error':
        return { 
          icon: WifiOff, 
          text: 'Connection Error', 
          color: 'text-red-600',
          bgColor: 'bg-red-100'
        };
      default:
        return { 
          icon: WifiOff, 
          text: 'Disconnected', 
          color: 'text-gray-600',
          bgColor: 'bg-gray-100'
        };
    }
  }, [connectionState]);

  // Vehicle selection handler
  const handleVehicleSelect = useCallback((vehicle: VehicleData) => {
    setSelectedVehicle(vehicle.id === selectedVehicle?.id ? null : vehicle);
  }, [selectedVehicle]);

  // Manual refresh handler
  const handleRefresh = useCallback(() => {
    refreshPositions();
    refetchVehicles();
    if (showTrails) {
      forceRefreshTrails();
    }
  }, [refreshPositions, refetchVehicles, showTrails, forceRefreshTrails]);

  // Get trail for selected vehicle
  const selectedVehicleTrail = useMemo(() => {
    if (!selectedVehicle || !showTrails) return [];
    return getVehicleTrail(selectedVehicle.device_id);
  }, [selectedVehicle, showTrails, getVehicleTrail]);

  const StatusIcon = connectionStatus.icon;

  if (isLoadingVehicles) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Loading live tracking data...</p>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  const error = vehicleError || realtimeError;

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Navigation className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Live Vehicle Tracking</h1>
                <p className="text-sm text-muted-foreground">
                  Real-time vehicle monitoring with WebSocket connectivity
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${connectionStatus.bgColor}`}>
                <StatusIcon className={`h-4 w-4 ${connectionStatus.color} ${connectionState === 'connecting' ? 'animate-spin' : ''}`} />
                <span className={`text-xs font-medium ${connectionStatus.color}`}>
                  {connectionStatus.text}
                </span>
              </div>

              {/* Real-time Stats */}
              {realtimeStats.totalUpdates > 0 && (
                <div className="text-xs text-muted-foreground">
                  <div>Updates: {realtimeStats.totalUpdates}</div>
                  {realtimeStats.lastUpdateTime && (
                    <div>Last: {realtimeStats.lastUpdateTime.toLocaleTimeString()}</div>
                  )}
                </div>
              )}

              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-700">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-sm font-medium">Connection Issue: {error.message}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Settings Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Real-time Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="websocket"
                    checked={enableWebSocket}
                    onCheckedChange={setEnableWebSocket}
                  />
                  <Label htmlFor="websocket" className="text-sm">
                    WebSocket Connection
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="trails"
                    checked={showTrails}
                    onCheckedChange={setShowTrails}
                  />
                  <Label htmlFor="trails" className="text-sm">
                    Vehicle Trails
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="autorefresh"
                    checked={autoRefresh}
                    onCheckedChange={setAutoRefresh}
                  />
                  <Label htmlFor="autorefresh" className="text-sm">
                    Auto Refresh
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Label htmlFor="trail-hours" className="text-sm">
                    Trail Hours:
                  </Label>
                  <select
                    id="trail-hours"
                    value={trailHours}
                    onChange={(e) => setTrailHours(Number(e.target.value))}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value={1}>1 hour</option>
                    <option value={6}>6 hours</option>
                    <option value={12}>12 hours</option>
                    <option value={24}>24 hours</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters and Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <LiveTrackingFilters
                onFiltersChange={setFilters}
                userOptions={userOptions}
              />
            </div>
            <div>
              <LiveTrackingStats 
                statistics={statistics}
                realtimeStats={realtimeStats}
                isWebSocketConnected={isWebSocketConnected}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Live Map View
                      {showTrails && (
                        <Badge variant="outline" className="ml-2">
                          <Route className="h-3 w-3 mr-1" />
                          Trails {isLoadingTrails ? '(Loading...)' : ''}
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        <Activity className="h-3 w-3 mr-1" />
                        {enhancedVehicles.filter(v => v.isOnline).length} Online
                      </Badge>
                      <Badge variant="outline">
                        {enhancedVehicles.length} Total
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <MapTilerMap
                    vehicles={enhancedVehicles}
                    height="600px"
                    onVehicleSelect={handleVehicleSelect}
                    selectedVehicle={selectedVehicle}
                    showControls={true}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Vehicle List */}
            <div>
              <VehicleListPanel
                vehicles={enhancedVehicles}
                selectedVehicle={selectedVehicle}
                onVehicleSelect={handleVehicleSelect}
                showTrails={showTrails}
                getVehicleTrail={getVehicleTrail}
              />
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default EnhancedLiveTrackingPage;
