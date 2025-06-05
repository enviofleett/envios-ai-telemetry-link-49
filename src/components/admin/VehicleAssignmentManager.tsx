
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Users, Car, RefreshCw, CheckCircle, Database, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { vehicleRedistributionService } from '@/services/vehicleRedistribution';
import { Alert, AlertDescription } from '@/components/ui/alert';

const VehicleAssignmentManager = () => {
  const [isRedistributing, setIsRedistributing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch assignment analysis
  const { data: analysis, isLoading: analysisLoading, refetch: refetchAnalysis } = useQuery({
    queryKey: ['vehicle-assignment-analysis'],
    queryFn: () => vehicleRedistributionService.analyzeCurrentAssignments(),
    refetchInterval: 30000,
  });

  // Fetch data integrity validation
  const { data: integrity, refetch: refetchIntegrity } = useQuery({
    queryKey: ['gp51-data-integrity'],
    queryFn: () => vehicleRedistributionService.validateGp51DataIntegrity(),
    enabled: false, // Only run when explicitly requested
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
          description: `Successfully redistributed ${result.redistributed} vehicles. ${result.skippedInvalidUsernames} vehicles skipped due to invalid GP51 usernames.`,
        });
      } else {
        toast({
          title: 'Redistribution Issues',
          description: `Redistributed ${result.redistributed} vehicles with ${result.errors.length} errors. Check console for details.`,
          variant: 'destructive',
        });
      }
      
      // Log detailed summary to console
      console.log('Redistribution Summary:', result.summary);
      
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

  const handleValidateIntegrity = async () => {
    setIsValidating(true);
    try {
      await refetchIntegrity();
      toast({
        title: 'Data Integrity Check Complete',
        description: 'Check the results below for recommendations.',
      });
    } catch (error) {
      toast({
        title: 'Validation Failed',
        description: 'Failed to validate data integrity',
        variant: 'destructive',
      });
    } finally {
      setIsValidating(false);
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
        <div className="flex gap-2">
          <Button 
            onClick={handleValidateIntegrity}
            disabled={isValidating}
            variant="outline"
            size="sm"
          >
            <Database className="h-4 w-4 mr-2" />
            {isValidating ? 'Validating...' : 'Check Data Integrity'}
          </Button>
          <Button 
            onClick={() => refetchAnalysis()}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {analysis && (
        <>
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

          {/* Data Integrity Results */}
          {integrity && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Database className="h-5 w-5" />
                  Data Integrity Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Valid Usernames:</span>
                    <div className="text-lg font-bold text-green-600">{integrity.validUsernames}</div>
                  </div>
                  <div>
                    <span className="font-medium">Empty Usernames:</span>
                    <div className="text-lg font-bold text-orange-600">{integrity.emptyUsernames}</div>
                  </div>
                  <div>
                    <span className="font-medium">Generic "User":</span>
                    <div className="text-lg font-bold text-red-600">{integrity.genericUsernames}</div>
                  </div>
                  <div>
                    <span className="font-medium">Total Invalid:</span>
                    <div className="text-lg font-bold text-red-600">{integrity.invalidUsernames}</div>
                  </div>
                </div>
                
                {integrity.recommendations.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-blue-800 mb-2">Recommendations:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                      {integrity.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Panel */}
          {analysis.redistributionNeeded && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <AlertTriangle className="h-5 w-5" />
                  Vehicle Assignment Action Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-orange-700">
                  <p className="mb-2">
                    The system has detected vehicles that can be redistributed based on GP51 usernames.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>{analysis.unassignedVehicles} vehicles are currently unassigned</li>
                    <li>{analysis.validGp51Usernames} vehicles have valid GP51 usernames for redistribution</li>
                    <li>{analysis.invalidGp51Usernames} vehicles have invalid GP51 usernames and will be skipped</li>
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
                      'Redistribute Vehicles'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
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
        </>
      )}
    </div>
  );
};

export default VehicleAssignmentManager;
