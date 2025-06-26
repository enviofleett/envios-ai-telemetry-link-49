
// Fix isolatedModules error by using 'export type'
export type {
  GP51AuthResponse,
  GP51User,
  GP51Device,
  GP51Group,
  GP51MonitorListResponse,
  GP51Session,
  GP51HealthStatus,
  GP51Position,
  GP51DashboardSummary,
  GP51DeviceData,
  GP51ProcessResult,
  GP51TestResult,
  GPS51DataResponse,
  GP51LiveVehiclesResponse,
  GP51TelemetryData,
  GP51ProcessedPosition,
  VehicleGP51Metadata,
  UnifiedGP51Response,
  UnifiedGP51Service,
  // Legacy aliases
  GPS51Device,
  GPS51Group,
  GPS51User,
  GPS51Position,
  GPS51DashboardSummary,
  GPS51TestResult
} from '@/types/gp51';

// Export the service implementation
export { UnifiedGP51ServiceImpl, unifiedGP51Service } from './UnifiedGP51Service';

// Re-export commonly used service instances
export { unifiedGP51Service as default } from './UnifiedGP51Service';
