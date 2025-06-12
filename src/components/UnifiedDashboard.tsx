
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useUnifiedVehicleData } from '@/hooks/useUnifiedVehicleData';
import { 
  Car, 
  Activity, 
  AlertTriangle, 
  MapPin, 
  RefreshCw,
  Search,
  Gauge,
  Clock,
  Navigation
} from 'lucide-react';

const UnifiedDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'alerts'>('all');
  
  const { 
    vehicles, 
    metrics,
    isLoading, 
    isRefreshing, 
    forceRefresh,
    getVehiclesByStatus
  } = useUnifiedVehicleData({ search: searchTerm, status: statusFilter });

  const getStatusColor = (vehicle: any) => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const isOnline = vehicle.lastPosition?.timestamp && 
      vehicle.lastPosition.timestamp > thirtyMinutesAgo;
    
    if (vehicle.status?.toLowerCase().includes('alert')) return 'bg-red-100 text-red-800';
    if (isOnline) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (vehicle: any) => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const isOnline = vehicle.lastPosition?.timestamp && 
      vehicle.lastPosition.timestamp > thirtyMinutesAgo;
    
    if (vehicle.status?.toLowerCase().includes('alert')) return 'Alert';
    if (isOnline) return 'Online';
    return 'Offline';
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fleet Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Real-time monitoring and management of your entire fleet
          </p>
        </div>
        <Button
          onClick={forceRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Syncing...' : 'Refresh'}
        </Button>
      </div>

      {/* Fleet Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total}</div>
            <p className="text-xs text-muted-foreground">Active fleet vehicles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.online}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <MapPin className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{metrics.offline}</div>
            <p className="text-xs text-muted-foreground">Not reporting</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.alerts}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Sync Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Sync Status</span>
            <Badge variant="outline">
              Last sync: {metrics.lastSyncTime.toLocaleTimeString()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Positions Updated:</span>
              <div className="font-medium">{metrics.positionsUpdated}</div>
            </div>
            <div>
              <span className="text-gray-600">Total Processed:</span>
              <div className="font-medium">{metrics.totalVehicles}</div>
            </div>
            <div>
              <span className="text-gray-600">Errors:</span>
              <div className="font-medium text-red-600">{metrics.errors}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Management Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="live-tracking">Live Tracking</TabsTrigger>
          <TabsTrigger value="detailed-view">Detailed View</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fleet Status Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{metrics.online}</div>
                  <div className="text-sm text-gray-600">Vehicles Online</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {metrics.total > 0 ? ((metrics.online / metrics.total) * 100).toFixed(1) : 0}% of fleet
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">{metrics.offline}</div>
                  <div className="text-sm text-gray-600">Vehicles Offline</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {metrics.total > 0 ? ((metrics.offline / metrics.total) * 100).toFixed(1) : 0}% of fleet
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{metrics.alerts}</div>
                  <div className="text-sm text-gray-600">Active Alerts</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Requiring immediate attention
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="live-tracking" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search vehicles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  {['all', 'online', 'offline', 'alerts'].map((status) => (
                    <Button
                      key={status}
                      variant={statusFilter === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStatusFilter(status as any)}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {vehicles.map((vehicle) => (
              <Card key={vehicle.deviceId} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{vehicle.deviceName}</h3>
                      <p className="text-sm text-gray-600">ID: {vehicle.deviceId}</p>
                    </div>
                    <Badge className={getStatusColor(vehicle)}>
                      {getStatusText(vehicle)}
                    </Badge>
                  </div>

                  {vehicle.lastPosition && (
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">Location</span>
                        </div>
                        <span className="font-mono text-xs">
                          {vehicle.lastPosition.lat.toFixed(4)}, {vehicle.lastPosition.lon.toFixed(4)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Gauge className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">Speed</span>
                        </div>
                        <span className="font-medium">
                          {vehicle.lastPosition.speed} km/h
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">Last Update</span>
                        </div>
                        <span className="text-xs">
                          {vehicle.lastPosition.timestamp.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Navigation className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">Direction</span>
                        </div>
                        <span className="font-medium">
                          {vehicle.lastPosition.course}°
                        </span>
                      </div>
                    </div>
                  )}

                  {!vehicle.lastPosition && (
                    <div className="text-center py-4 text-gray-500">
                      <MapPin className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No location data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {vehicles.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No vehicles found matching your filters.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="detailed-view" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Fleet Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                Detailed fleet management features including device configuration, 
                service management, and advanced analytics will be available here.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnifiedDashboard;
