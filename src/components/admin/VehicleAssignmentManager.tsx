
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { vehicleRedistributionService } from '@/services/vehicleRedistribution';
import VehicleAssignmentHeader from './VehicleAssignmentHeader';
import VehicleAssignmentOverview from './VehicleAssignmentOverview';
import DataIntegritySection from './DataIntegritySection';
import RedistributionActionPanel from './RedistributionActionPanel';

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

  return (
    <div className="space-y-6">
      <VehicleAssignmentHeader
        onValidateIntegrity={handleValidateIntegrity}
        onRefresh={() => refetchAnalysis()}
        isValidating={isValidating}
      />

      {analysis && (
        <>
          <VehicleAssignmentOverview analysis={analysis} />
          
          <DataIntegritySection integrity={integrity} />

          <RedistributionActionPanel
            analysis={analysis}
            onRedistribute={handleRedistribute}
            isRedistributing={isRedistributing}
          />
        </>
      )}
    </div>
  );
};

export default VehicleAssignmentManager;
