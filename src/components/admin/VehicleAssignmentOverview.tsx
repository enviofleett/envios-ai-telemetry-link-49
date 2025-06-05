
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Users, Car, CheckCircle, Info } from 'lucide-react';
import { AnalysisResult } from '@/services/vehicleRedistribution';

interface VehicleAssignmentOverviewProps {
  analysis: AnalysisResult;
}

const VehicleAssignmentOverview = ({ analysis }: VehicleAssignmentOverviewProps) => {
  const getStatusColor = (redistributionNeeded: boolean) => {
    return redistributionNeeded ? 'destructive' : 'default';
  };

  const getStatusIcon = (redistributionNeeded: boolean) => {
    return redistributionNeeded ? 
      <AlertTriangle className="h-4 w-4" /> : 
      <CheckCircle className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis.totalVehicles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {analysis.unassignedVehicles}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users with Vehicles</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis.usersWithVehicles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valid GP51 Names</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analysis.validGp51Usernames}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            {getStatusIcon(analysis.redistributionNeeded)}
          </CardHeader>
          <CardContent>
            <Badge variant={getStatusColor(analysis.redistributionNeeded)}>
              {analysis.redistributionNeeded ? 'Needs Redistribution' : 'Balanced'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Data Integrity Warning */}
      {analysis.invalidGp51Usernames > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-yellow-800">
            <strong>Data Quality Issue:</strong> {analysis.invalidGp51Usernames} vehicles have invalid or missing GP51 usernames. 
            These vehicles cannot be automatically redistributed. Consider re-importing vehicle data with correct GP51 usernames.
          </AlertDescription>
        </Alert>
      )}

      {/* Success State */}
      {!analysis.redistributionNeeded && analysis.validGp51Usernames > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-center gap-2 p-4">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800">
              Vehicle assignments are properly distributed. {analysis.validGp51Usernames} vehicles have valid GP51 usernames.
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VehicleAssignmentOverview;
