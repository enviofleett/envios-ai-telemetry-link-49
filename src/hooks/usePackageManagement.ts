
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { packageService, type SubscriberPackage } from '@/services/packageService';
import { useToast } from '@/hooks/use-toast';

export const usePackageManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for getting all packages
  const { data: packages, isLoading: isLoadingPackages, error: packagesError } = useQuery({
    queryKey: ['packages'],
    queryFn: () => packageService.getActivePackages(),
  });

  // Query for getting user's current package
  const getUserPackageQuery = (userId: string) => useQuery({
    queryKey: ['user-package', userId],
    queryFn: () => packageService.getUserPackage(userId),
    enabled: !!userId,
  });

  // Mutation for assigning package to user
  const assignPackageMutation = useMutation({
    mutationFn: ({ userId, packageId }: { userId: string; packageId: string }) =>
      packageService.assignPackageToUser(userId, packageId),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Package assigned successfully',
        });
        queryClient.invalidateQueries({ queryKey: ['user-package'] });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to assign package',
          variant: 'destructive',
        });
      }
    },
  });

  // Mutation for auto-assigning default package
  const autoAssignMutation = useMutation({
    mutationFn: (userId: string) => packageService.autoAssignDefaultPackage(userId),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Default package assigned successfully',
        });
        queryClient.invalidateQueries({ queryKey: ['user-package'] });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to assign default package',
          variant: 'destructive',
        });
      }
    },
  });

  return {
    packages: packages || [],
    isLoadingPackages,
    packagesError,
    getUserPackage: getUserPackageQuery,
    assignPackage: assignPackageMutation.mutate,
    isAssigning: assignPackageMutation.isPending,
    autoAssignDefaultPackage: autoAssignMutation.mutate,
    isAutoAssigning: autoAssignMutation.isPending,
  };
};
