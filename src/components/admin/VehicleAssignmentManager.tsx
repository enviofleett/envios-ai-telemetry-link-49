
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Users, Car, RefreshCw, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { vehicleRedistributionService } from '@/services/vehicleRedistribution';

const VehicleAssignmentManager = () => {
  const [isRedistributing, setIsRedistributing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch assignment analysis
  const { data: analysis, isLoading: analysisLoading, refetch: refetchAnalysis } = useQuery({
    queryKey: ['vehicle-assignment-analysis'],
    queryFn: () => vehicleRedistributionService.analyzeCurrentAssignments(),
    refetchInterval: 30000,
  });

  // Redistribution mutation
  const redistributeMutation = useMutation({
    mutationFn: () => vehicleRedistributionService.redistributeVehicles(),
    onMutate: () => {
      setIsRedistributing(true);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: 'Redistribution Complete',
          description: `Successfully redistributed ${result.redistributed} vehicles`,
        });
      } else {
        toast({
          title: 'Redistribution Issues',
          description: `Redistributed ${result.redistributed} vehicles with ${result.errors.length} errors`,
          variant: 'destructive',
        });
      }
      queryClient.invalidateQueries({ queryKey: ['vehicle-assignment-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['users-optimized'] });
    },
    onError: (error) => {
      toast({
        title: 'Redistribution Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsRedistributing(false);
    },
  });

  const handleRedistribute = () => {
    if (confirm('This will redistribute vehicles based on GP51 usernames. Continue?')) {
      redistributeMutation.mutate();
    }
  };

  if (analysisLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Analyzing vehicle assignments...
        </CardContent>
      </Card>
    );
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Vehicle Assignment Manager</h2>
          <p className="text-gray-600 mt-1">Monitor and manage vehicle-user assignments</p>
        </div>
        <Button 
          onClick={() => refetchAnalysis()}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {analysis && (
        <>
          {/* Status Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

          {/* Action Panel */}
          {analysis.redistributionNeeded && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <AlertTriangle className="h-5 w-5" />
                  Critical: Vehicle Assignment Imbalance Detected
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-orange-700">
                  <p className="mb-2">
                    The system has detected a critical imbalance in vehicle assignments that requires immediate attention.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Only {analysis.usersWithVehicles} users have vehicle assignments</li>
                    <li>{analysis.unassignedVehicles} vehicles are currently unassigned</li>
                    <li>This may impact user experience and system functionality</li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleRedistribute}
                    disabled={isRedistributing}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {isRedistributing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Redistributing...
                      </>
                    ) : (
                      'Fix Vehicle Assignments'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success State */}
          {!analysis.redistributionNeeded && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="flex items-center gap-2 p-4">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800">
                  Vehicle assignments are properly distributed across users.
                </span>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default VehicleAssignmentManager;
