
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Navigation, 
  RefreshCw, 
  Activity, 
  MapPin,
  Zap,
  Timer
} from 'lucide-react';
import LiveTrackingContent from '@/components/tracking/LiveTrackingContent';
import LiveTrackingControls from '@/components/tracking/LiveTrackingControls';
import LiveTrackingStats from '@/components/tracking/LiveTrackingStats';
import { useUnifiedVehicleData } from '@/hooks/useUnifiedVehicleData';
import { vehiclePositionSyncService } from '@/services/vehiclePosition/vehiclePositionSyncService';
import { useToast } from '@/hooks/use-toast';

const LiveTracking: React.FC = () => {
  const [viewMode, setViewMode] = useState<'cards' | 'map'>('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'alerts'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [liveModeEnabled, setLiveModeEnabled] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  const { toast } = useToast();

  const { 
    vehicles, 
    metrics, 
    syncMetrics,
    isLoading, 
    isRefreshing, 
    forceRefresh 
  } = useUnifiedVehicleData({
    search: searchTerm,
    status: statusFilter
  });

  useEffect(() => {
    // Update last refresh time when metrics change
    if (syncMetrics?.lastSyncTime) {
      setLastUpdateTime(syncMetrics.lastSyncTime);
    }
  }, [syncMetrics]);

  const handleLiveModeToggle = (enabled: boolean) => {
    setLiveModeEnabled(enabled);
    vehiclePositionSyncService.enableLiveMode(enabled);
    
    toast({
      title: enabled ? "Live Mode Enabled" : "Live Mode Disabled",
      description: enabled 
        ? "Position updates every 15 seconds for active vehicles" 
        : "Returning to 30-second update intervals",
      variant: enabled ? "default" : "destructive"
    });
  };

  const handleForceRefresh = async () => {
    try {
      await forceRefresh();
      setLastUpdateTime(new Date());
      toast({
        title: "Data Refreshed",
        description: "Vehicle positions have been updated"
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Unable to refresh vehicle data",
        variant: "destructive"
      });
    }
  };

  const getTimeSinceLastUpdate = () => {
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - lastUpdateTime.getTime()) / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    return `${Math.floor(diffSeconds / 3600)}h ago`;
  };

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
                  Real-time vehicle positions and status monitoring
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Live Mode Toggle */}
              <div className="flex items-center gap-2">
                <Zap className={`h-4 w-4 ${liveModeEnabled ? 'text-red-500' : 'text-gray-400'}`} />
                <Switch
                  checked={liveModeEnabled}
                  onCheckedChange={handleLiveModeToggle}
                />
                <span className="text-sm font-medium">
                  Live Mode {liveModeEnabled && <span className="text-red-500">(15s)</span>}
                </span>
              </div>

              {/* View Mode Toggles */}
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                >
                  Cards
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                >
                  <MapPin className="h-4 w-4 mr-1" />
                  Map
                </Button>
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-500" />
                    <span className="text-sm">
                      <span className="font-medium">{metrics.online}</span> online
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                    <span className="text-sm">
                      <span className="font-medium">{metrics.offline}</span> offline
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span className="text-sm">
                      <span className="font-medium">{metrics.alerts}</span> alerts
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Timer className="h-4 w-4" />
                    <span>Last update: {getTimeSinceLastUpdate()}</span>
                  </div>
                  
                  <Button 
                    onClick={handleForceRefresh} 
                    size="sm" 
                    variant="outline"
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Tracking Stats */}
          <LiveTrackingStats 
            metrics={metrics}
            syncMetrics={syncMetrics}
            liveModeEnabled={liveModeEnabled}
          />

          {/* Controls */}
          <LiveTrackingControls
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            onRefresh={handleForceRefresh}
            isRefreshing={isRefreshing}
          />

          {/* Main Content */}
          {isLoading ? (
            <Card>
              <CardContent className="py-8">
                <div className="flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading vehicle data...</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <LiveTrackingContent 
              viewMode={viewMode}
              vehicles={vehicles}
            />
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default LiveTracking;
