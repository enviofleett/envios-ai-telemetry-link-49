
export interface Package {
  id: string;
  name: string;
  description: string;
  associated_user_type: 'end_user' | 'sub_admin';
  price: number;
  billing_cycle: string;
  max_vehicles: number | null;
  features: string[];
  is_active: boolean;
}

export interface RegistrationRequest {
  name: string;
  email: string;
  phone_number?: string;
  company_name?: string;
  selected_package_id: string;
  additional_data?: Record<string, any>;
}

export interface PendingRegistration {
  id: string;
  email: string;
  name: string;
  phone_number?: string;
  company_name?: string;
  selected_package_id: string;
  registration_data: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  admin_notes?: string;
  packages: Package;
}
