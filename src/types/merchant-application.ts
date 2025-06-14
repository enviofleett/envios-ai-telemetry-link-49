
export type MerchantApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'requires_more_info'
  | 'approved'
  | 'rejected';

export interface MerchantApplication {
  id: string;
  user_id: string;
  org_name: string;
  contact_email: string;
  business_address?: string | null;
  website_url?: string | null;
  business_type?: string | null;
  business_registration_id?: string | null;
  tax_id?: string | null;
  status: MerchantApplicationStatus;
  submitted_at?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
  documents?: MerchantApplicationDocument[];
  selected_category_ids?: string[] | null;
  total_fee?: number | null;
  is_paid: boolean;
}

export interface MerchantApplicationDocument {
  id: string;
  application_id: string;
  document_type: string;
  file_path: string;
  uploaded_at: string;
  verified: boolean;
  verified_by?: string | null;
  verified_at?: string | null;
}

export interface MerchantCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
}
