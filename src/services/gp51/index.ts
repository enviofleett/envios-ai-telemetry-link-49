
// Fix isolatedModules error by using 'export type'
export type {
  GP51AuthResponse,
  GP51Device as GP51DeviceData,
  GP51ProcessResult,
  GP51TestResult,
  GP51LiveVehiclesResponse,
  GP51TelemetryData,
  GP51ProcessedPosition,
  GP51Group,
  GP51Position,
  GP51DeviceTreeResponse as GP51ServiceResponse,
  GP51HealthStatus,
  GP51PerformanceMetrics,
  // Legacy aliases
  GP51TestResult as GPS51TestResult,
  GP51Device as GPS51Device,
  GP51Group as GPS51Group,
  GP51Position as GPS51Position
} from '@/types/gp51-unified';

// Export the service implementation and class
export { UnifiedGP51Service, unifiedGP51Service } from './UnifiedGP51Service';
export { GP51PropertyMapper } from '@/types/gp51-unified';

// Re-export commonly used service instances
export { unifiedGP51Service as default } from './UnifiedGP51Service';
