
// Fix isolatedModules error by using 'export type'
export type {
  GP51AuthResponse,
  GP51DeviceData,
  GP51ProcessResult,
  GP51TestResult,
  GP51LiveVehiclesResponse,
  GP51TelemetryData,
  GP51ProcessedPosition,
  GP51Group,
  GP51Position,
  GP51ServiceResponse,
  // Legacy aliases
  GPS51TestResult,
  GPS51Device,
  GPS51Group,
  GPS51Position
} from '@/types/gp51-unified';

// Export the service implementation
export { UnifiedGP51Service, unifiedGP51Service } from './UnifiedGP51Service';

// Re-export commonly used service instances
export { unifiedGP51Service as default } from './UnifiedGP51Service';
