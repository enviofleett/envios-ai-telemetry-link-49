
export interface DataSharingProduct {
  id: string;
  category: string;
  name: string;
  description?: string;
  base_cost_usd_per_month: number;
  cost_per_vehicle_usd_per_month: number;
  data_points_included: string[];
  features: Record<string, any>;
  max_vehicles_allowed?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  product_id?: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending_payment';
  paystack_reference_id?: string;
  total_amount_paid_usd: number;
  tenure_months: number;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

export interface SharingToken {
  id: string;
  token: string;
  subscription_id: string;
  user_id: string;
  vehicle_ids: string[];
  expires_at: string;
  is_active: boolean;
  revoked_at?: string;
  last_used_at?: string;
  usage_count: number;
  created_at: string;
}

export interface SubscriptionVehicle {
  subscription_id: string;
  vehicle_id: string;
  assigned_at: string;
}

export interface ApiUsageLog {
  id: string;
  token_id: string;
  user_id: string;
  endpoint: string;
  vehicle_id?: string;
  request_method: string;
  response_status: number;
  response_time_ms?: number;
  request_data?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface CreateSubscriptionRequest {
  userId: string;
  productId: string;
  vehicleIds: string[];
  tenureMonths: number;
  paystackReferenceId: string;
  totalAmount: number;
}

export interface TokenValidationResult {
  isValid: boolean;
  token?: SharingToken;
  subscription?: UserSubscription;
  product?: DataSharingProduct;
  authorizedVehicleIds: string[];
  error?: string;
}

export interface VehicleTelemetryData {
  vehicle_id: string;
  location?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  speed?: number;
  mileage?: {
    daily: number;
    total: number;
  };
  fuel_consumption?: number;
  engine_data?: Record<string, any>;
  voltage?: number;
  last_updated: string;
}
