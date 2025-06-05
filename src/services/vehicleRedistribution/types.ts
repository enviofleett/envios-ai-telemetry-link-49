
export interface VehicleAssignment {
  device_id: string;
  device_name: string;
  gp51_username?: string;
  current_user_id?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  gp51_username?: string;
  assigned_vehicle_count: number;
}

export interface AnalysisResult {
  totalVehicles: number;
  unassignedVehicles: number;
  usersWithVehicles: number;
  redistributionNeeded: boolean;
  validGp51Usernames: number;
  invalidGp51Usernames: number;
}

export interface RedistributionResult {
  success: boolean;
  redistributed: number;
  errors: string[];
  skippedInvalidUsernames: number;
  summary: string[];
}

export interface DataIntegrityResult {
  totalVehicles: number;
  validUsernames: number;
  invalidUsernames: number;
  emptyUsernames: number;
  genericUsernames: number;
  recommendations: string[];
}
