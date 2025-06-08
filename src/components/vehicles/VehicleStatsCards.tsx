
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, CheckCircle, AlertTriangle, Settings, Wifi, WifiOff } from 'lucide-react';
import type { EnhancedVehicle } from './EnhancedVehicleManagementPage';

interface VehicleStatsCardsProps {
  vehicles: EnhancedVehicle[];
}

export const VehicleStatsCards: React.FC<VehicleStatsCardsProps> = ({ vehicles }) => {
  const totalVehicles = vehicles.length;
  const onlineVehicles = vehicles.filter((v) => v.status === "online").length;
  const offlineVehicles = vehicles.filter((v) => v.status === "offline").length;
  const maintenanceVehicles = vehicles.filter((v) => v.status === "maintenance").length;
  const inactiveVehicles = vehicles.filter((v) => v.status === "inactive").length;

  // Calculate additional metrics
  const activeVehicles = vehicles.filter((v) => v.is_active).length;
  const alertVehicles = vehicles.filter((v) => {
    // Check for vehicles needing attention (maintenance due, low fuel, etc.)
    const needsMaintenance = v.nextService && new Date(v.nextService) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const lowFuel = v.fuelLevel && v.fuelLevel < 20;
    const documentExpiring = v.insuranceExpiry && new Date(v.insuranceExpiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return needsMaintenance || lowFuel || documentExpiring;
  }).length;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
          <Car className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalVehicles}</div>
          <p className="text-xs text-muted-foreground">
            {activeVehicles} active in fleet
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Online</CardTitle>
          <Wifi className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{onlineVehicles}</div>
          <p className="text-xs text-muted-foreground">
            {totalVehicles > 0 ? Math.round((onlineVehicles / totalVehicles) * 100) : 0}% of fleet
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Offline</CardTitle>
          <WifiOff className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{offlineVehicles}</div>
          <p className="text-xs text-muted-foreground">
            {maintenanceVehicles} in maintenance
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alerts</CardTitle>
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">{alertVehicles}</div>
          <p className="text-xs text-muted-foreground">
            need attention
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
