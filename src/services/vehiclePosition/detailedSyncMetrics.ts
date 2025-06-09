
export interface DetailedSyncMetrics {
  // Timestamp conversion tracking
  timestampConversions: {
    total: number;
    successful: number;
    failed: number;
    scientificNotationHandled: number;
    invalidFormats: number;
  };
  
  // Position data validation
  positionValidation: {
    totalPositions: number;
    validPositions: number;
    invalidPositions: number;
    missingCoordinates: number;
    stalePositions: number;
  };
  
  // Data freshness categorization
  dataFreshness: {
    live: number; // < 1 minute
    recent: number; // 1-5 minutes
    stale: number; // 5-30 minutes
    offline: number; // > 30 minutes
  };
  
  // Database operations
  databaseOps: {
    successful: number;
    failed: number;
    totalAttempts: number;
  };
  
  // Performance metrics
  performance: {
    averageLatency: number;
    lastSyncDuration: number;
    syncStartTime: number;
  };
  
  // Error tracking
  errors: {
    apiErrors: number;
    conversionErrors: number;
    validationErrors: number;
    databaseErrors: number;
    recentErrors: string[];
  };
}

export const createEmptyMetrics = (): DetailedSyncMetrics => ({
  timestampConversions: {
    total: 0,
    successful: 0,
    failed: 0,
    scientificNotationHandled: 0,
    invalidFormats: 0,
  },
  positionValidation: {
    totalPositions: 0,
    validPositions: 0,
    invalidPositions: 0,
    missingCoordinates: 0,
    stalePositions: 0,
  },
  dataFreshness: {
    live: 0,
    recent: 0,
    stale: 0,
    offline: 0,
  },
  databaseOps: {
    successful: 0,
    failed: 0,
    totalAttempts: 0,
  },
  performance: {
    averageLatency: 0,
    lastSyncDuration: 0,
    syncStartTime: 0,
  },
  errors: {
    apiErrors: 0,
    conversionErrors: 0,
    validationErrors: 0,
    databaseErrors: 0,
    recentErrors: [],
  },
});
