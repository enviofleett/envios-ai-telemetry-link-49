
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import VehicleStatusCards from './VehicleStatusCards';
import UserManagementCards from './UserManagementCards';
import DashboardRefreshButton from './DashboardRefreshButton';
import { useUnifiedGP51Service } from '@/hooks/useUnifiedGP51Service';
import { useUserManagement } from '@/hooks/useUserManagement';

const FleetDashboard: React.FC = () => {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // GP51 fleet data
  const { 
    devices,
    positions,
    groups,
    isLoading: gp51Loading,
    queryMonitorList,
    getLastPositions
  } = useUnifiedGP51Service();

  // User management data
  const {
    users,
    userGroups,
    isLoading: userLoading,
    refreshAll: refreshUserData
  } = useUserManagement();

  // Calculate metrics
  const totalVehicles = devices.length;
  const onlineVehicles = positions.filter(p => p.isOnline).length;
  const offlineVehicles = positions.filter(p => !p.isOnline).length;
  const movingVehicles = positions.filter(p => p.isMoving).length;
  const inactiveVehicles = devices.filter(d => !d.isActive).length;
  const totalUsers = users.length;
  const totalUserGroups = userGroups.length;
  const totalDeviceGroups = groups.length;

  const isLoading = gp51Loading || userLoading;

  // Auto-refresh functionality
  const refreshAllData = async () => {
    try {
      await Promise.all([
        queryMonitorList(),
        getLastPositions(),
        refreshUserData()
      ]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Initial data load
  useEffect(() => {
    refreshAllData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fleet Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Real-time overview of your fleet operations
          </p>
        </div>
        <DashboardRefreshButton 
          onRefresh={refreshAllData}
          isLoading={isLoading}
          lastUpdated={lastUpdated}
        />
      </div>

      {/* Primary Metrics - Vehicle Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Vehicle Status Overview
          </CardTitle>
          <CardDescription>
            Real-time status of all vehicles in your fleet
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

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">
                {Math.round((onlineVehicles / totalVehicles) * 100) || 0}%
              </div>
              <div className="text-sm text-gray-600">Fleet Online Rate</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round((movingVehicles / onlineVehicles) * 100) || 0}%
              </div>
              <div className="text-sm text-gray-600">Active Movement Rate</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round((inactiveVehicles / totalVehicles) * 100) || 0}%
              </div>
              <div className="text-sm text-gray-600">Inactive Rate</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-gray-600">
                {Math.round(totalVehicles / totalDeviceGroups) || 0}
              </div>
              <div className="text-sm text-gray-600">Avg Vehicles/Group</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FleetDashboard;
