
export interface PasswordlessImportJob {
  jobName: string;
  adminGp51Username: string;
  adminGp51Password: string;
  targetUsernames: string[];
}

export interface GP51Vehicle {
  deviceid: string;
  devicename: string;
  simnum?: string;
  lastactivetime?: string;
  status?: string;
  lastPosition?: any;
}

export interface UserImportResult {
  gp51_username: string;
  envio_user_id?: string;
  vehicles_count: number;
  success: boolean;
  error?: string;
}
