
import { useEnhancedVehicleData } from './useEnhancedVehicleData';
import type { VehicleData } from '@/services/EnhancedVehicleDataService';

export interface UseQueryResult<T, E = Error> {
  data: T;
  vehicles: T;
  allVehicles: T;
  filteredVehicles: T;
  userOptions: any[];
  isLoading: boolean;
  error: E | null;
  refetch: () => Promise<void>;
}

export function useVehicleQuery(): UseQueryResult<VehicleData[]> {
  const enhancedData = useEnhancedVehicleData();

  return {
    data: enhancedData.vehicles,
    vehicles: enhancedData.vehicles,
    allVehicles: enhancedData.allVehicles,
    filteredVehicles: enhancedData.filteredVehicles,
    userOptions: enhancedData.userOptions,
    isLoading: enhancedData.isLoading,
    error: enhancedData.error,
    refetch: enhancedData.refetch
  };
}
