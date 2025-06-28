import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface FleetDashboardProps {
  totalVehicles: number | string;
  activeVehicles: number | string;
  alerts: any[];
}

const FleetDashboard: React.FC<FleetDashboardProps> = ({ 
  totalVehicles, 
  activeVehicles, 
  alerts = [] 
}) => {
  // Type conversion utilities
  const ensureNumber = (value: number | string): number => {
    if (typeof value === 'number') return value;
    const parsed = parseFloat(String(value));
    return isNaN(parsed) ? 0 : parsed;
  };

  const ensureString = (value: number | string): string => {
    return String(value);
  };

  const ensureBoolean = (value: number | string | boolean): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value > 0;
    return Boolean(value);
  };

  // Convert props to correct types
  const totalVehiclesNum = ensureNumber(totalVehicles);
  const activeVehiclesNum = ensureNumber(activeVehicles);
  const totalVehiclesStr = ensureString(totalVehicles);
  const activeVehiclesStr = ensureString(activeVehicles);
  const hasActiveVehicles = ensureBoolean(activeVehiclesNum);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalVehiclesStr}</div>
          <p className="text-xs text-muted-foreground">
            Fleet size
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeVehiclesStr}</div>
          <p className="text-xs text-muted-foreground">
            Currently online
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {hasActiveVehicles ? 'Yes' : 'No'}
          </div>
          <p className="text-xs text-muted-foreground">
            Fleet activity
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{alerts.length}</div>
          <p className="text-xs text-muted-foreground">
            Active alerts
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FleetDashboard;

// Add named export for compatibility
export { FleetDashboard };
