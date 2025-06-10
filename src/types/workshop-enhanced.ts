
export const WORKSHOP_PERMISSIONS = {
  MANAGE_STAFF: 'manage_staff',
  VIEW_TRANSACTIONS: 'view_transactions',
  MANAGE_INSPECTIONS: 'manage_inspections',
  ASSIGN_INSPECTORS: 'assign_inspectors',
  VIEW_INSPECTIONS: 'view_inspections',
  UPDATE_INSPECTIONS: 'update_inspections',
  CONDUCT_INSPECTIONS: 'conduct_inspections',
  UPDATE_INSPECTION_RESULTS: 'update_inspection_results',
  MANAGE_SETTINGS: 'manage_settings'
} as const;

export type WorkshopPermission = typeof WORKSHOP_PERMISSIONS[keyof typeof WORKSHOP_PERMISSIONS];

export interface WorkshopUser {
  id: string;
  workshop_id: string;
  email: string;
  name: string;
  role: 'owner' | 'manager' | 'technician' | 'inspector';
  permissions: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkshopSession {
  id: string;
  workshop_user_id: string;
  workshop_id: string;
  expires_at: string;
  created_at: string;
}

export interface WorkshopActivity {
  id: string;
  workshop_id: string;
  user_id?: string;
  activity_type: string;
  entity_type?: string;
  entity_id?: string;
  activity_data: any;
  timestamp: string;
}

export interface InspectionFormTemplate {
  id: string;
  workshop_id: string;
  template_name: string;
  template_description?: string;
  vehicle_category: string;
  form_fields: any[];
  is_default: boolean;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  version: number;
}
