
export interface DeviceType {
  id: string;
  gp51_device_type_id: number;
  type_name: string;
  type_code?: string;
  default_id_length?: number;
  default_offline_delay?: number;
  functions?: number;
  functions_long?: number;
  price_1_year?: number;
  price_3_year?: number;
  price_5_year?: number;
  price_10_year?: number;
  features?: Record<string, any>;
  remark?: string;
  remark_en?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeviceGroup {
  id: string;
  name: string;
  description?: string;
  parent_group_id?: string;
  gp51_group_id?: number;
  color_code?: string;
  created_at: string;
  updated_at: string;
}

export interface DeviceTag {
  id: string;
  name: string;
  color: string;
  description?: string;
  created_at: string;
}

export interface DeviceConfiguration {
  id: string;
  device_id: string;
  configuration_name: string;
  configuration_data: Record<string, any>;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DeviceHistory {
  id: string;
  device_id: string;
  action_type: string;
  action_description?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  performed_by?: string;
  created_at: string;
}

export interface BulkOperationRequest {
  operation: 'enable' | 'disable' | 'delete' | 'update' | 'assign_group' | 'assign_tags';
  device_ids: string[];
  data?: Record<string, any>;
}

export interface DeviceFilter {
  search?: string;
  device_type?: number;
  status?: string;
  group_id?: string;
  tags?: string[];
  is_active?: boolean;
}

export interface DeviceStatusInfo {
  device_id: string;
  online_status: 'online' | 'offline' | 'unknown';
  last_communication?: string;
  signal_strength?: number;
  battery_level?: number;
  location_accuracy?: number;
}
