
export interface GP51Vehicle {
  deviceid: string;
  devicename?: string;
  devicetype?: number;
  simnum?: string;
  simiccid?: string;
  createtime?: number;
  lastactivetime?: number;
  status?: string;
  lastPosition?: {
    lat: number;
    lon: number;
    speed: number;
    course: number;
    updatetime: string;
    statusText: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface UserImportResult {
  gp51_username: string;
  envio_user_id?: string;
  vehicles_count: number;
  success: boolean;
  error?: string;
  operation?: 'created' | 'updated';
  processingTimeMs?: number;
}

export interface PasswordlessImportJob {
  id: string;
  job_name: string;
  import_type: 'passwordless';
  total_usernames: number;
  processed_usernames: number;
  successful_imports: number;
  failed_imports: number;
  total_vehicles_imported: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  admin_gp51_username: string;
  imported_usernames: string[];
  import_results?: UserImportResult[];
  error_log?: any[];
  created_at: string;
  updated_at: string;
  completed_at?: string;
  progress_percentage?: number;
  current_step?: string;
  step_details?: string;
}

export interface GP51AuthResult {
  success: boolean;
  token?: string;
  error?: string;
}

export interface GP51ValidationResult {
  success: boolean;
  token?: string;
  error?: string;
}

export interface AtomicImportStats {
  usersCreated: number;
  usersUpdated: number;
  vehicleStorageFailures: number;
  totalProcessingTime: number;
  averageProcessingTimePerUser: number;
  vehicleToUserRatio: number;
}
