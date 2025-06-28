
export type {
  GP51AuthResponse,
  GP51Device as GP51DeviceData,
  GP51HealthStatus,
  GP51PerformanceMetrics,
  GP51Group,
  GP51Position,
  GP51FleetDataResponse as GP51ServiceResponse,
  GP51ProcessedPosition,
  GP51FleetData,
  GP51LiveData,
  GP51ConnectionTestResult,
  GP51TestResult,
  GP51ConnectionTesterProps,
  RealAnalyticsData,
  AnalyticsHookReturn,
  UseProductionGP51ServiceReturn
} from '@/types/gp51-unified';

export { UnifiedGP51Service, unifiedGP51Service } from './UnifiedGP51Service';
export { GP51PropertyMapper } from '@/types/gp51-unified';

export { unifiedGP51Service as default } from './UnifiedGP51Service';
