
export interface DeviceFilter {
  search?: string;
  device_type?: number;
  status?: string;
  is_active?: boolean;
  tags?: string[];
  group_id?: number;
}

export interface DeviceType {
  id: number;
  name: string;
  description?: string;
  gp51_type_id?: number;
  created_at: string;
  updated_at: string;
}

export interface DeviceTag {
  id: number;
  name: string;
  color?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface DeviceGroup {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  created_at: string;
  updated_at: string;
}

export interface EnhancedDevice {
  id: string;
  device_id: string;
  device_name: string;
  status: string;
  is_active: boolean;
  gp51_metadata?: any;
  sim_number?: string;
  notes?: string;
  tags?: DeviceTag[];
  device_type?: DeviceType;
  group?: DeviceGroup;
  created_at: string;
  updated_at: string;
}
