import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SystemHealthIndicator from '@/components/admin/SystemHealthIndicator';
import { EnhancedVehicleRegistration } from './EnhancedVehicleRegistration';
import { useOptimizedVehicleData } from '@/hooks/useOptimizedVehicleData';
import { Search, RefreshCw, AlertTriangle, Car, Settings } from 'lucide-react';
const EnhancedVehicleManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOfflineOnly, setShowOfflineOnly] = useState(false);
  const {
    data: vehiclesData,
    isLoading,
    error,
    refetch
  } = useOptimizedVehicleData({
    enabled: true,
    refreshInterval: 30000
  });
  const vehicles = vehiclesData?.vehicles || [];

  // Filter vehicles based on search term and offline filter
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = !searchTerm || vehicle.device_name?.toLowerCase().includes(searchTerm.toLowerCase()) || vehicle.device_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOfflineFilter = !showOfflineOnly || vehicle.status === 'offline';
    return matchesSearch && matchesOfflineFilter;
  });

  // Calculate stats
  const totalVehicles = vehicles.length;
  const onlineVehicles = vehicles.filter(v => v.status === 'online').length;
  const offlineVehicles = vehicles.filter(v => v.status === 'offline').length;
  const vehiclesWithRecentData = vehicles.filter(v => {
    if (!v.last_position?.updatetime) return false;
    const lastUpdate = new Date(v.last_position.updatetime);
    const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
    return hoursSinceUpdate < 1;
  }).length;
  const handleRefresh = () => {
    refetch();
  };
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  return <div className="space-y-6">
      {/* System Health Indicator */}
      <SystemHealthIndicator />

      {/* Enhanced Tabs for Different Views */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          
          
          
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Enhanced Header with Search and Controls */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-6 w-6" />
                  Vehicle Management Overview
                  <Badge variant={error ? 'destructive' : 'secondary'}>
                    {isLoading ? 'Loading...' : `${totalVehicles} vehicles`}
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant={showOfflineOnly ? "default" : "outline"} size="sm" onClick={() => setShowOfflineOnly(!showOfflineOnly)}>
                    <Settings className="h-4 w-4 mr-1" />
                    {showOfflineOnly ? 'Show All' : 'Offline Only'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                    {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search vehicles by name or ID..." value={searchTerm} onChange={handleSearchChange} className="pl-10" />
                </div>
                <div className="text-sm text-gray-500">
                  {filteredVehicles.length} of {totalVehicles} vehicles
                </div>
              </div>

              {error && <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load vehicle data. This may be due to GP51 connectivity issues.
                    <Button variant="outline" size="sm" onClick={handleRefresh} className="ml-2">
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>}

              {/* Vehicle Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Vehicles</p>
                      <p className="text-2xl font-bold">{totalVehicles}</p>
                    </div>
                    <Car className="h-8 w-8 text-blue-600" />
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Online</p>
                      <p className="text-2xl font-bold text-green-600">{onlineVehicles}</p>
                    </div>
                    <Settings className="h-8 w-8 text-green-600" />
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Offline</p>
                      <p className="text-2xl font-bold text-red-600">{offlineVehicles}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Recent Data</p>
                      <p className="text-2xl font-bold text-purple-600">{vehiclesWithRecentData}</p>
                    </div>
                    <RefreshCw className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Vehicle Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Status & Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-4"></div>
                  <span>Loading vehicles...</span>
                </div> : <div className="space-y-4">
                  {filteredVehicles.length === 0 ? <div className="text-center py-8 text-gray-500">
                      {searchTerm || showOfflineOnly ? 'No vehicles match your filters' : 'No vehicles found'}
                    </div> : <div className="grid gap-4">
                      {filteredVehicles.map(vehicle => <div key={vehicle.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">{vehicle.device_name}</h3>
                              <p className="text-sm text-gray-500">ID: {vehicle.device_id}</p>
                            </div>
                            <Badge variant={vehicle.status === 'online' ? 'default' : 'secondary'}>
                              {vehicle.status}
                            </Badge>
                          </div>
                          {vehicle.last_position && <div className="mt-2 text-xs text-gray-500">
                              Last update: {new Date(vehicle.last_position.updatetime).toLocaleString()}
                            </div>}
                        </div>)}
                    </div>}
                </div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="registration" className="space-y-6">
          <EnhancedVehicleRegistration />
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Vehicle Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Real-time monitoring features will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>;
};
export default EnhancedVehicleManagement;