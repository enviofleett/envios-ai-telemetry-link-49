
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUnifiedVehicleData } from '@/hooks/useUnifiedVehicleData';
import VehiclePositionMonitor from '@/components/fleet/VehiclePositionMonitor';
import FleetOverviewTab from '@/components/fleet/FleetOverviewTab';
import FleetAnalyticsTab from '@/components/fleet/FleetAnalyticsTab';
import FleetPerformanceTab from '@/components/fleet/FleetPerformanceTab';
import FleetSystemTab from '@/components/fleet/FleetSystemTab';

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
          <FleetOverviewTab
            metrics={metrics}
            syncMetrics={syncMetrics}
            vehicles={vehicles}
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            onRefresh={forceRefresh}
            getVehiclesByStatus={getVehiclesByStatus}
          />
        </TabsContent>

        <TabsContent value="positions" className="space-y-6">
          <VehiclePositionMonitor />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <FleetAnalyticsTab
            metrics={metrics}
            syncMetrics={syncMetrics}
            vehicles={vehicles}
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <FleetPerformanceTab
            metrics={metrics}
            syncMetrics={syncMetrics}
            vehicles={vehicles}
          />
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <FleetSystemTab syncMetrics={syncMetrics} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FleetManagement;
