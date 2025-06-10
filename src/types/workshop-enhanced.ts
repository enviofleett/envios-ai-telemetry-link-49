
export interface WorkshopPermission {
  id: string;
  workshop_id: string;
  user_id: string;
  role: 'owner' | 'manager' | 'technician' | 'inspector';
  permissions: string[];
  assigned_by: string;
  assigned_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InspectionFormTemplate {
  id: string;
  workshop_id: string;
  template_name: string;
  template_description?: string;
  vehicle_category?: string;
  form_fields: FormField[];
  is_default: boolean;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'rating';
  label: string;
  description?: string;
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface WorkshopTransaction {
  id: string;
  workshop_id: string;
  customer_id: string;
  vehicle_id?: string;
  transaction_type: 'connection_fee' | 'activation_fee' | 'service_fee' | 'inspection_fee';
  amount: number;
  currency: string;
  payment_status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  payment_method?: string;
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  transaction_date: string;
  service_description?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface WorkshopApprovalLog {
  id: string;
  workshop_id: string;
  action: 'approved' | 'rejected' | 'suspended' | 'reactivated';
  notes?: string;
  performed_by: string;
  performed_at: string;
}

export interface InspectorAssignment {
  id: string;
  inspection_id: string;
  inspector_id: string;
  assigned_by: string;
  assignment_status: 'assigned' | 'accepted' | 'declined' | 'completed';
  assigned_at: string;
  accepted_at?: string;
  notes?: string;
  created_at: string;
}

export interface WorkshopStaffMember {
  id: string;
  user_id: string;
  workshop_id: string;
  role: 'owner' | 'manager' | 'technician' | 'inspector';
  permissions: string[];
  is_active: boolean;
  user: {
    name: string;
    email: string;
  };
}

export interface PaymentCalculation {
  baseAmount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  breakdown: {
    item: string;
    amount: number;
  }[];
}

export interface InspectionFormData {
  templateId: string;
  vehicleId: string;
  inspectorId?: string;
  scheduledDate: string;
  formResponses: {
    fieldId: string;
    value: any;
  }[];
  notes?: string;
}

export const WORKSHOP_PERMISSIONS = {
  MANAGE_STAFF: 'manage_staff',
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_TRANSACTIONS: 'view_transactions',
  MANAGE_INSPECTIONS: 'manage_inspections',
  ASSIGN_INSPECTORS: 'assign_inspectors',
  VIEW_INSPECTIONS: 'view_inspections',
  CONDUCT_INSPECTIONS: 'conduct_inspections',
  UPDATE_INSPECTIONS: 'update_inspections',
  UPDATE_INSPECTION_RESULTS: 'update_inspection_results'
} as const;

export const TRANSACTION_TYPES = {
  CONNECTION_FEE: 'connection_fee',
  ACTIVATION_FEE: 'activation_fee',
  SERVICE_FEE: 'service_fee',
  INSPECTION_FEE: 'inspection_fee'
} as const;

export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
} as const;
