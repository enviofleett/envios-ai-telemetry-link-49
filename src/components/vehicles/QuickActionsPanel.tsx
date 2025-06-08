import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, FileText, BarChart3, FileSpreadsheet } from 'lucide-react';
import type { EnhancedVehicle } from './EnhancedVehicleManagementPage';

interface QuickActionsPanelProps {
  vehicles: EnhancedVehicle[];
}

export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({ vehicles }) => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Maintenance Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {vehicles.slice(0, 3).map((vehicle) => (
            <div key={vehicle.deviceid} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{vehicle.deviceid} - {vehicle.make} {vehicle.model}</span>
              </div>
              <Badge variant="outline">
                {Math.ceil((new Date(vehicle.nextService).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
              </Badge>
            </div>
          ))}
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
          {vehicles.slice(0, 3).map((vehicle) => {
            const daysUntilInsuranceExpiry = Math.ceil(
              (new Date(vehicle.insuranceExpiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );
            return (
              <div key={vehicle.deviceid} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className={`h-4 w-4 ${daysUntilInsuranceExpiry < 30 ? 'text-red-500' : 'text-muted-foreground'}`} />
                  <span className="text-sm">{vehicle.deviceid} - Insurance</span>
                </div>
                <Badge 
                  variant={daysUntilInsuranceExpiry < 30 ? 'destructive' : 'outline'}
                >
                  {daysUntilInsuranceExpiry} days
                </Badge>
              </div>
            );
          })}
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
              <span className="font-medium">2.3 years</span>
            </div>
            <Progress value={46} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Maintenance Compliance</span>
              <span className="font-medium">92%</span>
            </div>
            <Progress value={92} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Fleet Utilization</span>
              <span className="font-medium">78%</span>
            </div>
            <Progress value={78} className="h-2" />
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
