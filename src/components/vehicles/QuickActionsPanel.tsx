
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, FileText, BarChart3, FileSpreadsheet, AlertTriangle, Clock } from 'lucide-react';
import type { EnhancedVehicle } from './EnhancedVehicleManagementPage';

interface QuickActionsPanelProps {
  vehicles: EnhancedVehicle[];
}

export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({ vehicles }) => {
  // Calculate maintenance schedule data
  const upcomingMaintenance = vehicles
    .filter(v => v.nextService)
    .sort((a, b) => new Date(a.nextService!).getTime() - new Date(b.nextService!).getTime())
    .slice(0, 3);

  // Calculate document renewals
  const documentRenewals = vehicles
    .filter(v => v.insuranceExpiry)
    .map(v => {
      const daysUntilExpiry = Math.ceil(
        (new Date(v.insuranceExpiry!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return { ...v, daysUntilExpiry };
    })
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
    .slice(0, 3);

  // Calculate fleet analytics
  const totalVehicles = vehicles.length;
  const onlineVehicles = vehicles.filter(v => v.status === 'online').length;
  const averageAge = vehicles.reduce((sum, v) => {
    const age = v.year ? new Date().getFullYear() - v.year : 0;
    return sum + age;
  }, 0) / totalVehicles;

  // Calculate maintenance compliance (vehicles with recent service)
  const recentlyServiced = vehicles.filter(v => {
    if (!v.lastService) return false;
    const lastServiceDate = new Date(v.lastService);
    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
    return lastServiceDate > sixMonthsAgo;
  }).length;
  const maintenanceCompliance = totalVehicles > 0 ? (recentlyServiced / totalVehicles) * 100 : 0;

  // Calculate fleet utilization (online vehicles)
  const fleetUtilization = totalVehicles > 0 ? (onlineVehicles / totalVehicles) * 100 : 0;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Maintenance Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {upcomingMaintenance.length > 0 ? (
            upcomingMaintenance.map((vehicle) => {
              const daysUntil = Math.ceil(
                (new Date(vehicle.nextService!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );
              return (
                <div key={vehicle.deviceid} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {vehicle.deviceid} - {vehicle.make || 'Vehicle'} {vehicle.model || ''}
                    </span>
                  </div>
                  <Badge variant={daysUntil < 7 ? "destructive" : "outline"}>
                    {daysUntil > 0 ? `${daysUntil} days` : 'Overdue'}
                  </Badge>
                </div>
              );
            })
          ) : (
            <div className="text-sm text-muted-foreground">No upcoming maintenance scheduled</div>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">
            <FileText className="h-4 w-4 mr-2" />
            View Full Schedule
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Document Renewals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {documentRenewals.length > 0 ? (
            documentRenewals.map((vehicle) => (
              <div key={vehicle.deviceid} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className={`h-4 w-4 ${vehicle.daysUntilExpiry < 30 ? 'text-red-500' : 'text-muted-foreground'}`} />
                  <span className="text-sm">{vehicle.deviceid} - Insurance</span>
                </div>
                <Badge 
                  variant={vehicle.daysUntilExpiry < 30 ? 'destructive' : 'outline'}
                >
                  {vehicle.daysUntilExpiry > 0 ? `${vehicle.daysUntilExpiry} days` : 'Expired'}
                </Badge>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No upcoming document renewals</div>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            View All Documents
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Fleet Analytics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Average Fleet Age</span>
              <span className="font-medium">{averageAge.toFixed(1)} years</span>
            </div>
            <Progress value={Math.min((averageAge / 10) * 100, 100)} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Maintenance Compliance</span>
              <span className="font-medium">{maintenanceCompliance.toFixed(0)}%</span>
            </div>
            <Progress value={maintenanceCompliance} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Fleet Utilization</span>
              <span className="font-medium">{fleetUtilization.toFixed(0)}%</span>
            </div>
            <Progress value={fleetUtilization} className="h-2" />
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Detailed Analytics
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
