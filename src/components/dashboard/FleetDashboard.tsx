
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import VehicleStatusCards from './VehicleStatusCards';
import UserManagementCards from './UserManagementCards';
import DashboardRefreshButton from './DashboardRefreshButton';
import { Badge } from '@/components/ui/badge';
import { useUnifiedGP51Service } from '@/hooks/useUnifiedGP51Service';
import { useUserManagement } from '@/hooks/useUserManagement';
import { Activity, AlertCircle, CheckCircle } from 'lucide-react';
import type { GP51Position } from '@/types/gp51-unified';

const FleetDashboard: React.FC = () => {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // GP51 fleet data
  const { 
    devices,
    positions,
    groups,
    healthStatus,
    performanceMetrics,
    isLoading: gp51Loading,
    error: gp51Error,
    refreshAllData
  } = useUnifiedGP51Service();

  // User management data
  const {
    users,
    userGroups,
    isLoading: userLoading,
    refreshAll: refreshUserData
  } = useUserManagement();

  // Calculate metrics with proper isOnline handling
  const totalVehicles = devices.length;
  
  // Enhanced position processing with proper online status
  const positionsWithOnlineStatus = positions.map((position: GP51Position) => {
    const isOnline = position.isOnline !== undefined ? 
      position.isOnline : 
      isPositionRecent(position.timestamp);
    
    return {
      ...position,
      isOnline
    };
  });
  
  const onlineVehicles = positionsWithOnlineStatus.filter(p => p.isOnline).length;
  const offlineVehicles = totalVehicles - onlineVehicles;
  const movingVehicles = positionsWithOnlineStatus.filter(p => p.isMoving && p.isOnline).length;
  const inactiveVehicles = devices.filter(d => !d.isActive).length;
  const totalUsers = users.length;
  const totalUserGroups = userGroups.length;
  const totalDeviceGroups = groups.length;

  const isLoading = gp51Loading || userLoading;

  // Helper function to determine if position is recent (online)
  const isPositionRecent = (timestamp: number | string): boolean => {
    let positionTime: Date;
    
    if (typeof timestamp === 'string') {
      positionTime = new Date(timestamp);
    } else {
      positionTime = new Date(timestamp * 1000); // Convert from seconds to milliseconds
    }
    
    const now = new Date();
    const diffMinutes = (now.getTime() - positionTime.getTime()) / (1000 * 60);
    return diffMinutes <= 10; // Consider online if position is within 10 minutes
  };

  // Auto-refresh functionality
  const refreshAllData_Dashboard = async () => {
    try {
      await Promise.all([
        refreshAllData(),
        refreshUserData()
      ]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshAllData_Dashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  // Initial data load
  useEffect(() => {
    refreshAllData_Dashboard();
  }, []);

  // Connection status indicator
  const getConnectionStatus = () => {
    if (!healthStatus) {
      return { color: 'gray', text: 'Unknown', icon: AlertCircle };
    }
    
    if (healthStatus.isHealthy) {
      return { color: 'green', text: 'Connected', icon: CheckCircle };
    }
    
    return { color: 'red', text: 'Disconnected', icon: AlertCircle };
  };

  const connectionStatus = getConnectionStatus();
  const ConnectionIcon = connectionStatus.icon;

  return (
    <div className="space-y-6">
      {/* Header with Connection Status */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fleet Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Real-time overview of your fleet operations
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ConnectionIcon className={`h-4 w-4 text-${connectionStatus.color}-500`} />
            <Badge 
              variant={connectionStatus.color === 'green' ? 'default' : 'destructive'}
              className="flex items-center gap-1"
            >
              <div className={`h-2 w-2 rounded-full bg-${connectionStatus.color}-500 animate-pulse`}></div>
              GP51 {connectionStatus.text}
            </Badge>
          </div>
          <DashboardRefreshButton 
            onRefresh={refreshAllData_Dashboard}
            isLoading={isLoading}
            lastUpdated={lastUpdated}
          />
        </div>
      </div>

      {/* Performance Metrics Summary */}
      {performanceMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {performanceMetrics.responseTime}ms
                </div>
                <div className="text-gray-600">Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {Math.round((1 - performanceMetrics.errorRate) * 100)}%
                </div>
                <div className="text-gray-600">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">
                  {performanceMetrics.apiCallCount}
                </div>
                <div className="text-gray-600">API Calls</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">
                  {performanceMetrics.onlineDevices}
                </div>
                <div className="text-gray-600">Online Devices</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {gp51Error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">GP51 Connection Error:</span>
              <span>{gp51Error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Primary Metrics - Vehicle Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Vehicle Status Overview
          </CardTitle>
          <CardDescription>
            Real-time status of all vehicles in your fleet ({totalVehicles} total vehicles, {positions.length} with GPS data)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VehicleStatusCards
            totalVehicles={totalVehicles}
            onlineVehicles={onlineVehicles}
            offlineVehicles={offlineVehicles}
            movingVehicles={movingVehicles}
            inactiveVehicles={inactiveVehicles}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Secondary Metrics - User Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Management Overview
          </CardTitle>
          <CardDescription>
            User and organizational structure metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserManagementCards
            totalUsers={totalUsers}
            totalUserGroups={totalUserGroups}
            totalDeviceGroups={totalDeviceGroups}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Enhanced Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Fleet Intelligence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">
                {totalVehicles > 0 ? Math.round((onlineVehicles / totalVehicles) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Fleet Online Rate</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-600">
                {onlineVehicles > 0 ? Math.round((movingVehicles / onlineVehicles) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Active Movement Rate</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-orange-600">
                {totalVehicles > 0 ? Math.round((inactiveVehicles / totalVehicles) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Inactive Rate</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-gray-600">
                {totalDeviceGroups > 0 ? Math.round(totalVehicles / totalDeviceGroups) : totalVehicles}
              </div>
              <div className="text-sm text-gray-600">Avg Vehicles/Group</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Quality Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>Data Quality</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Devices with GPS Data:</span>
              <div className="flex items-center gap-2">
                <span className="text-sm">{positions.length} / {totalVehicles}</span>
                <Badge variant={positions.length > 0 ? 'default' : 'secondary'}>
                  {totalVehicles > 0 ? Math.round((positions.length / totalVehicles) * 100) : 0}%
                </Badge>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Recent Position Updates:</span>
              <div className="flex items-center gap-2">
                <span className="text-sm">{onlineVehicles}</span>
                <Badge variant={onlineVehicles > 0 ? 'default' : 'secondary'}>
                  Last 10 minutes
                </Badge>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">System Health:</span>
              <Badge variant={healthStatus?.isHealthy ? 'default' : 'destructive'}>
                {healthStatus?.status || 'Unknown'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FleetDashboard;
