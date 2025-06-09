
import { useOwners } from './useOwners';
import { useOwnerMutations } from './useOwnerMutations';

export const useOwnerManagement = () => {
  const ownersQuery = useOwners();
  const mutations = useOwnerMutations();

  return {
    owners: ownersQuery.data || [],
    isLoadingOwners: ownersQuery.isLoading,
    ownersError: ownersQuery.error,
    ...mutations,
  };
};

// Re-export for backwards compatibility
export { useOwnerVehicles } from './useOwnerVehicles';
