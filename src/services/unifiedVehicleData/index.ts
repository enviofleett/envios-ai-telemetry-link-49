
export { UnifiedVehicleDataService } from './unifiedVehicleDataService';
export type { Vehicle, VehicleMetrics } from './types';

// Create and export the singleton instance
import { UnifiedVehicleDataService } from './unifiedVehicleDataService';
export const unifiedVehicleDataService = new UnifiedVehicleDataService();
