export interface SubscriberPackage {
  id: string;
  package_name: string;
  description?: string;
  user_type: 'end_user' | 'sub_admin' | 'both';
  subscription_fee_monthly?: number;
  subscription_fee_annually?: number;
  referral_discount_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  vehicle_limit?: number | null;
}

export interface PackageFeature {
  id: string;
  feature_id: string;
  feature_name: string;
  description?: string;
  category: string;
  is_active: boolean;
  created_at: string;
}

export interface PackageFeatureAssignment {
  id: string;
  package_id: string;
  feature_id: string;
  assigned_at: string;
}

export interface MenuPermission {
  id: string;
  menu_code: string;
  menu_name: string;
  description?: string;
  parent_menu_code?: string;
  is_active: boolean;
  created_at: string;
}

export interface PackageMenuPermission {
  id: string;
  package_id: string;
  menu_permission_id: string;
  assigned_at: string;
}

export interface ReferralCode {
  id: string;
  code: string;
  created_by?: string;
  discount_percentage: number;
  usage_limit?: number;
  usage_count: number;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  package_id: string;
  subscription_status: 'active' | 'inactive' | 'suspended' | 'cancelled';
  billing_cycle: 'monthly' | 'annually';
  start_date: string;
  end_date?: string;
  referral_code_used?: string;
  discount_applied: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePackageRequest {
  package_name: string;
  description?: string;
  user_type: 'end_user' | 'sub_admin' | 'both';
  subscription_fee_monthly?: number;
  subscription_fee_annually?: number;
  referral_discount_percentage?: number;
  feature_ids: string[];
  menu_permission_ids: string[];
  vehicle_limit?: number | null;
}

export interface UpdatePackageRequest extends Partial<CreatePackageRequest> {
  id: string;
}
