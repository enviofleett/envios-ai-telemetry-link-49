
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUnifiedVehicleData } from '@/hooks/useUnifiedVehicleData';
import { 
  Car, 
  Activity, 
  AlertTriangle, 
  MapPin, 
  RefreshCw,
  Gauge,
  Navigation,
  Clock,
  Eye,
  Map,
  TrendingUp
} from 'lucide-react';
import VehicleDetailsModal from './VehicleDetailsModal';
import FleetMapView from './FleetMapView';
import DashboardNavigation from './DashboardNavigation';
import type { Vehicle } from '@/services/unifiedVehicleData';

const UnifiedFleetDashboard: React.FC = () => {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showMap, setShowMap] = useState(false);
  
  const { 
    vehicles, 
    metrics, 
    syncMetrics, 
    isLoading, 
    isRefreshing, 
    forceRefresh,
    getVehiclesByStatus 
  } = useUnifiedVehicleData();

  const vehiclesByStatus = getVehiclesByStatus();

  const getVehicleStatus = (vehicle: Vehicle) => {
    if (!vehicle.lastPosition?.updatetime) return 'offline';
    
    const lastUpdate = new Date(vehicle.lastPosition.updatetime);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (minutesSinceUpdate <= 5) return 'online';
    if (minutesSinceUpdate <= 30) return 'idle';
    return 'offline';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusBadge = (vehicle: Vehicle) => {
    const status = getVehicleStatus(vehicle);
    const hasAlert = vehicle.status?.toLowerCase().includes('alert') || 
                    vehicle.status?.toLowerCase().includes('alarm');
    
    if (hasAlert) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Alert
      </Badge>;
    }
    
    return <Badge variant={status === 'online' ? 'default' : 'secondary'} className="flex items-center gap-1">
      <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}></div>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fleet Command Center</h1>
          <p className="text-gray-600 mt-1">
            Unified view of all {metrics.total} vehicles with real-time insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowMap(!showMap)}
            className="flex items-center gap-2"
          >
            <Map className="h-4 w-4" />
            {showMap ? 'Show List' : 'Show Map'}
          </Button>
          <Button
            onClick={forceRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Syncing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fleet</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total}</div>
            <p className="text-xs text-muted-foreground">
              Active vehicles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Now</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.online}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.total > 0 ? ((metrics.online / metrics.total) * 100).toFixed(1) : 0}% of fleet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Need Attention</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.alerts}</div>
            <p className="text-xs text-muted-foreground">
              Active alerts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {syncMetrics.positionsUpdated}
            </div>
            <p className="text-xs text-muted-foreground">
              Last sync: {syncMetrics.lastSyncTime.toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Fleet Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {metrics.total > 0 ? ((metrics.online / metrics.total) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-sm text-gray-600">Fleet Utilization</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {vehicles.filter(v => v.lastPosition?.speed && v.lastPosition.speed > 0).length}
              </div>
              <div className="text-sm text-gray-600">Vehicles Moving</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {syncMetrics.errors > 0 ? syncMetrics.errors : 0}
              </div>
              <div className="text-sm text-gray-600">Sync Issues</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      {showMap ? (
        <FleetMapView 
          vehicles={vehicles} 
          onVehicleSelect={setSelectedVehicle}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {vehicles.slice(0, 12).map((vehicle) => {
            const status = getVehicleStatus(vehicle);
            return (
              <Card key={vehicle.deviceid} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{vehicle.devicename}</h3>
                      <p className="text-sm text-gray-600">ID: {vehicle.deviceid}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(vehicle)}
                    </div>
                  </div>

                  {vehicle.lastPosition && (
                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                      <div className="flex items-center gap-1">
                        <Gauge className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-600">Speed:</span>
                        <span className="font-medium">{vehicle.lastPosition.speed} km/h</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Navigation className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-600">Course:</span>
                        <span className="font-medium">{vehicle.lastPosition.course}°</span>
                      </div>
                      <div className="flex items-center gap-1 col-span-2">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-600">Location:</span>
                        <span className="font-mono text-xs">
                          {vehicle.lastPosition.lat.toFixed(4)}, {vehicle.lastPosition.lon.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-xs text-gray-500">
                      {vehicle.lastPosition?.updatetime 
                        ? `Updated ${new Date(vehicle.lastPosition.updatetime).toLocaleTimeString()}`
                        : 'No recent data'
                      }
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedVehicle(vehicle)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Show More Button if there are more vehicles */}
      {!showMap && vehicles.length > 12 && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 mb-4">
              Showing 12 of {vehicles.length} vehicles
            </p>
            <Button variant="outline" onClick={() => setShowMap(true)}>
              View All on Map
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Navigation to Other Pages */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Navigation</CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardNavigation metrics={metrics} />
        </CardContent>
      </Card>

      {/* Vehicle Details Modal */}
      {selectedVehicle && (
        <VehicleDetailsModal
          vehicle={selectedVehicle}
          isOpen={!!selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
        />
      )}
    </div>
  );
};

export default UnifiedFleetDashboard;
