
export interface ChargeDevicesRequest {
  deviceids: number[];
  years: number;
  free: number;
  overduetime: string;
}

export interface ChargeDevicesResponse extends GP51ApiResponse {
  // Additional response fields if any
}

export interface ServiceRecord {
  id: string;
  deviceId: string;
  serviceStartDate: string;
  serviceEndDate: string;
  years: number;
  isFree: boolean;
  status: 'active' | 'expired' | 'suspended';
  created_at: string;
  updated_at: string;
}
