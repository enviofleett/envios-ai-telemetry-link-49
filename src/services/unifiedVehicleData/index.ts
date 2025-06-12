
export { UnifiedVehicleDataService } from './unifiedVehicleDataService';
export type { VehicleData, VehicleMetrics } from '@/types/vehicle';

// Create and export the singleton instance
import { UnifiedVehicleDataService } from './unifiedVehicleDataService';
export const unifiedVehicleDataService = new UnifiedVehicleDataService();
