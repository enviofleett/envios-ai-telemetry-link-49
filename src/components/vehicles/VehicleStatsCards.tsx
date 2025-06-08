
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, CheckCircle, AlertTriangle, Settings } from 'lucide-react';
import type { EnhancedVehicle } from './EnhancedVehicleManagementPage';

interface VehicleStatsCardsProps {
  vehicles: EnhancedVehicle[];
}

export const VehicleStatsCards: React.FC<VehicleStatsCardsProps> = ({ vehicles }) => {
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter((v) => v.status === "active").length;
  const maintenanceVehicles = vehicles.filter((v) => v.status === "maintenance").length;
  const inactiveVehicles = vehicles.filter((v) => v.status === "inactive").length;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
          <Car className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalVehicles}</div>
          <p className="text-xs text-muted-foreground">in fleet</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Vehicles</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{activeVehicles}</div>
          <p className="text-xs text-muted-foreground">operational</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Maintenance</CardTitle>
          <Settings className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">{maintenanceVehicles}</div>
          <p className="text-xs text-muted-foreground">being serviced</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Inactive</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{inactiveVehicles}</div>
          <p className="text-xs text-muted-foreground">not in service</p>
        </CardContent>
      </Card>
    </div>
  );
};
