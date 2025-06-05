
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUnifiedVehicleData } from '@/hooks/useUnifiedVehicleData';
import VehiclePositionMonitor from '@/components/fleet/VehiclePositionMonitor';
import GP51UsernameConsistencyManager from '@/components/fleet/GP51UsernameConsistencyManager';
import FleetMetricsDisplay from '@/components/fleet/FleetMetricsDisplay';
import VehicleStatusDistribution from '@/components/fleet/VehicleStatusDistribution';
import FleetQuickStats from '@/components/fleet/FleetQuickStats';
import { 
  Car, 
  BarChart3, 
  MapPin, 
  Calendar,
  Filter,
  Activity,
  Settings
} from 'lucide-react';

const FleetManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Fleet Management</h1>
        <p className="text-gray-600 mt-2">
          Comprehensive fleet overview, analytics, and real-time position monitoring
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Fleet Overview</TabsTrigger>
          <TabsTrigger value="positions">Live Positions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Insights</TabsTrigger>
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
          <TabsTrigger value="system">System Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <FleetMetricsDisplay 
            metrics={metrics} 
            syncMetrics={syncMetrics}
            isLoading={isLoading} 
            isRefreshing={isRefreshing}
            onRefresh={forceRefresh}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VehicleStatusDistribution 
              metrics={metrics}
              vehiclesByStatus={vehiclesByStatus}
              isLoading={isLoading}
            />

            <FleetQuickStats 
              metrics={metrics}
              vehicles={vehicles}
              isLoading={isLoading}
            />
          </div>
        </TabsContent>

        <TabsContent value="positions" className="space-y-6">
          <VehiclePositionMonitor />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fleet Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {metrics.total > 0 ? ((metrics.online / metrics.total) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-xs text-gray-600">Fleet Utilization</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {vehicles.length} / {metrics.total}
                  </div>
                  <div className="text-xs text-gray-600">Vehicles with Data</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {syncMetrics.lastSyncTime.toLocaleTimeString()}
                  </div>
                  <div className="text-xs text-gray-600">Last Sync</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Real-Time Vehicle Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Online Vehicles</span>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="font-bold">{metrics.online}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Offline Vehicles</span>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        <span className="font-bold">{metrics.offline}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Alerts</span>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="font-bold">{metrics.alerts}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sync Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{syncMetrics.totalVehicles}</div>
                  <div className="text-xs text-gray-600">Total Vehicles</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{syncMetrics.positionsUpdated}</div>
                  <div className="text-xs text-gray-600">Positions Updated</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{syncMetrics.errors}</div>
                  <div className="text-xs text-gray-600">Sync Errors</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {new Date(metrics.lastUpdateTime).toLocaleTimeString()}
                  </div>
                  <div className="text-xs text-gray-600">Last Update</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Vehicle Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vehicles.slice(0, 10).map((vehicle, index) => (
                  <div key={vehicle.deviceid} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{vehicle.devicename}</div>
                      <div className="text-sm text-gray-600">ID: {vehicle.deviceid}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium">
                          {vehicle.lastPosition?.speed ? `${vehicle.lastPosition.speed.toFixed(1)} km/h` : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-600">Speed</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">
                          {vehicle.lastPosition?.updatetime ? 
                            new Date(vehicle.lastPosition.updatetime).toLocaleTimeString() : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-600">Last Update</div>
                      </div>
                      <div className="text-center">
                        <div className={`w-3 h-3 rounded-full mx-auto ${
                          vehicle.lastPosition?.updatetime && 
                          new Date(vehicle.lastPosition.updatetime) > new Date(Date.now() - 30 * 60 * 1000) 
                            ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                        <div className="text-xs text-gray-600">Status</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">System Management</h2>
              <p className="text-gray-600">
                Manage system configurations and resolve data inconsistencies
              </p>
            </div>
            
            <GP51UsernameConsistencyManager />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm font-medium mb-2">Data Sync Status</div>
                    <div className={`px-2 py-1 rounded text-xs ${
                      syncMetrics.errors === 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {syncMetrics.errors === 0 ? 'Healthy' : `${syncMetrics.errors} Errors`}
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm font-medium mb-2">Last Sync</div>
                    <div className="text-sm text-gray-600">
                      {syncMetrics.lastSyncTime.toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FleetManagement;
