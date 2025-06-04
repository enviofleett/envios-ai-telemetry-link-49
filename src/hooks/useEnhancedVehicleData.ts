
import { useVehicleData } from './useVehicleData';
import { useVehicleFilters } from './useVehicleFilters';
import { useVehicleStatistics } from './useVehicleStatistics';
import { useVehicleActions } from './useVehicleActions';

export const useEnhancedVehicleData = () => {
  const { vehicles, isLoading, error, refetch } = useVehicleData();
  const { filters, setFilters, filteredVehicles, userOptions } = useVehicleFilters(vehicles);
  const statistics = useVehicleStatistics(vehicles);
  const { handleVehicleAction } = useVehicleActions();

  return {
    vehicles,
    filteredVehicles,
    userOptions,
    statistics,
    filters,
    setFilters,
    isLoading,
    error,
    refetch,
    handleVehicleAction
  };
};
