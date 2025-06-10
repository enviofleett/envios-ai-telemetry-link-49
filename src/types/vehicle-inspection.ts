
export interface VehicleInspection {
  id: string;
  vehicle_id: string;
  workshop_id: string;
  inspector_id?: string;
  inspection_type: 'routine' | 'annual' | 'pre_purchase' | 'diagnostic' | 'safety';
  inspection_status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'failed';
  scheduled_date: string;
  started_at?: string;
  completed_at?: string;
  inspection_notes?: string;
  overall_result?: 'pass' | 'fail' | 'conditional';
  estimated_duration_hours: number;
  actual_duration_minutes?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface InspectionChecklistItem {
  id: string;
  inspection_id: string;
  category: string;
  item_name: string;
  item_description?: string;
  is_required: boolean;
  check_status: 'pending' | 'pass' | 'fail' | 'n/a';
  inspector_notes?: string;
  severity_level?: 'low' | 'medium' | 'high' | 'critical';
  requires_repair: boolean;
  estimated_repair_cost?: number;
  checked_at?: string;
  checked_by?: string;
  created_at: string;
}

export interface InspectionPhoto {
  id: string;
  inspection_id: string;
  checklist_item_id?: string;
  photo_url: string;
  photo_description?: string;
  photo_type?: 'before' | 'after' | 'damage' | 'repair' | 'general';
  uploaded_by?: string;
  created_at: string;
}

export interface InspectionTemplate {
  id: string;
  template_name: string;
  inspection_type: string;
  vehicle_category?: string;
  checklist_items: TemplateChecklistItem[];
  estimated_duration_hours: number;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateChecklistItem {
  category: string;
  item_name: string;
  item_description?: string;
  is_required: boolean;
  severity_level?: 'low' | 'medium' | 'high' | 'critical';
}

export interface CreateInspectionData {
  vehicle_id: string;
  workshop_id: string;
  inspection_type: VehicleInspection['inspection_type'];
  scheduled_date: string;
  inspection_notes?: string;
  estimated_duration_hours?: number;
  template_id?: string;
}
