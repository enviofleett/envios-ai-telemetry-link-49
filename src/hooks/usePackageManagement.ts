
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { packageService } from '@/services/packageService';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';

export const usePackageManagement = () => {
  const queryClient = useQueryClient();
  const { user } = useUnifiedAuth();

  // Get all active packages
  const { data: packages, isLoading: packagesLoading } = useQuery({
    queryKey: ['active-packages'],
    queryFn: packageService.getActivePackages
  });

  // Get user's current package
  const { data: userPackage, isLoading: userPackageLoading } = useQuery({
    queryKey: ['user-package', user?.id],
    queryFn: () => user?.id ? packageService.getUserPackage(user.id) : null,
    enabled: !!user?.id
  });

  // Assign package mutation
  const assignPackageMutation = useMutation({
    mutationFn: ({ userId, packageId }: { userId: string; packageId: string }) =>
      packageService.assignPackageToUser(userId, packageId),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['user-package'] });
        toast.success('Package assigned successfully');
      } else {
        toast.error(result.error || 'Failed to assign package');
      }
    },
    onError: (error: any) => {
      toast.error('Failed to assign package: ' + error.message);
    }
  });

  // Auto-assign default package mutation
  const autoAssignDefaultMutation = useMutation({
    mutationFn: packageService.autoAssignDefaultPackage,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['user-package'] });
        toast.success('Default package assigned');
      } else {
        console.error('Failed to auto-assign default package:', result.error);
      }
    },
    onError: (error: any) => {
      console.error('Auto-assign error:', error);
    }
  });

  return {
    packages,
    userPackage,
    isLoading: packagesLoading || userPackageLoading,
    assignPackage: assignPackageMutation.mutate,
    autoAssignDefault: autoAssignDefaultMutation.mutate,
    isAssigning: assignPackageMutation.isPending,
    isAutoAssigning: autoAssignDefaultMutation.isPending
  };
};
