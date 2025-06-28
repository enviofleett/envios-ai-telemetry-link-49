
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RealAnalyticsData } from '@/types/gp51-unified';
import { createDefaultAnalyticsData } from '@/types/gp51-unified';

interface FleetAnalyticsDashboardProps {
  analyticsData?: RealAnalyticsData;
}

const FleetAnalyticsDashboard: React.FC<FleetAnalyticsDashboardProps> = ({ 
  analyticsData = createDefaultAnalyticsData() 
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analyticsData.totalVehicles}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analyticsData.activeVehicles}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fuel Efficiency</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analyticsData.performance.fuelEfficiency}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analyticsData.alerts.total}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FleetAnalyticsDashboard;
