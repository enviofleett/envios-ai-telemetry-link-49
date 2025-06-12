
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { PackageService } from '@/services/packageService';
import { PackageMappingService } from '@/services/packageMappingService';
import type { 
  SubscriberPackage, 
  CreatePackageRequest, 
  UpdatePackageRequest,
  PackageFeature,
  MenuPermission
} from '@/types/subscriber-packages';

export const usePackageManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all packages
  const { 
    data: packagesData, 
    isLoading: packagesLoading, 
    error: packagesError,
    refetch: refetchPackages
  } = useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const result = await PackageService.getAllPackages();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.packages || [];
    }
  });

  // Get all features
  const { 
    data: featuresData, 
    isLoading: featuresLoading 
  } = useQuery({
    queryKey: ['package-features'],
    queryFn: async () => {
      const result = await PackageService.getAllFeatures();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.features || [];
    }
  });

  // Get all menu permissions
  const { 
    data: permissionsData, 
    isLoading: permissionsLoading 
  } = useQuery({
    queryKey: ['menu-permissions'],
    queryFn: async () => {
      const result = await PackageService.getAllMenuPermissions();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.permissions || [];
    }
  });

  // Create package mutation
  const createPackageMutation = useMutation({
    mutationFn: async (request: CreatePackageRequest) => {
      const result = await PackageService.createPackage(request);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast({
        title: "Package Created",
        description: "The package has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update package mutation
  const updatePackageMutation = useMutation({
    mutationFn: async (request: UpdatePackageRequest) => {
      const result = await PackageService.updatePackage(request);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast({
        title: "Package Updated",
        description: "The package has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete package mutation
  const deletePackageMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const result = await PackageService.deletePackage(packageId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast({
        title: "Package Deleted",
        description: "The package has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Assign package to user mutation
  const assignPackageMutation = useMutation({
    mutationFn: async ({
      userId,
      packageId,
      billingCycle,
      referralCode
    }: {
      userId: string;
      packageId: string;
      billingCycle: 'monthly' | 'annually';
      referralCode?: string;
    }) => {
      const result = await PackageMappingService.assignPackageToUser(
        userId,
        packageId,
        billingCycle,
        referralCode
      );
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Package Assigned",
        description: "The package has been assigned to the user successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Assignment Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return {
    // Data
    packages: packagesData || [],
    features: featuresData || [],
    permissions: permissionsData || [],
    
    // Loading states
    packagesLoading,
    featuresLoading,
    permissionsLoading,
    
    // Error state
    packagesError,
    
    // Mutations
    createPackage: createPackageMutation.mutate,
    updatePackage: updatePackageMutation.mutate,
    deletePackage: deletePackageMutation.mutate,
    assignPackage: assignPackageMutation.mutate,
    
    // Mutation states
    isCreating: createPackageMutation.isPending,
    isUpdating: updatePackageMutation.isPending,
    isDeleting: deletePackageMutation.isPending,
    isAssigning: assignPackageMutation.isPending,
    
    // Utilities
    refetchPackages
  };
};

export const useUserPackage = (userId: string) => {
  const { toast } = useToast();

  const { 
    data: userSubscription, 
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['user-subscription', userId],
    queryFn: async () => {
      if (!userId) return null;
      const result = await PackageMappingService.getUserSubscription(userId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.subscription;
    },
    enabled: !!userId
  });

  const updateUserPackageMutation = useMutation({
    mutationFn: async ({
      newPackageId,
      billingCycle
    }: {
      newPackageId: string;
      billingCycle: 'monthly' | 'annually';
    }) => {
      const result = await PackageMappingService.updateUserPackage(
        userId,
        newPackageId,
        billingCycle
      );
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "Package Updated",
        description: "User package has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return {
    userSubscription,
    isLoading,
    error,
    updateUserPackage: updateUserPackageMutation.mutate,
    isUpdating: updateUserPackageMutation.isPending,
    refetch
  };
};

export const useReferralCodeValidation = () => {
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    discount?: number;
    error?: string;
  } | null>(null);

  const validateReferralCode = async (code: string) => {
    if (!code.trim()) {
      setValidationResult(null);
      return;
    }

    const result = await PackageMappingService.validateReferralCode(code);
    setValidationResult(result);
  };

  return {
    validationResult,
    validateReferralCode,
    clearValidation: () => setValidationResult(null)
  };
};
