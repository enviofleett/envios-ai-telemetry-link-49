
export interface VehicleRecord {
  device_id: string;
  device_name: string;
  is_active: boolean;
  gp51_username: string;
}

export interface ProcessingResult {
  updatedCount: number;
  errors: number;
  totalProcessed: number;
  totalRequested: number;
  completionRate: number;
  avgProcessingTime: number;
}

export interface VehiclePositionUpdate {
  device_id: string;
  last_position: {
    lat: number;
    lon: number;
    speed: number;
    course: number;
    updatetime: string;
    statusText: string;
  };
  updated_at: string;
}

export interface BatchProcessingResult {
  updatedCount: number;
  errors: number;
  batchSize: number;
}
