
export interface GeofenceFormData {
  name: string;
  description?: string;
  fence_type: 'inclusion' | 'exclusion';
  is_active: boolean;
  alert_on_enter: boolean;
  alert_on_exit: boolean;
}

export interface GeofenceManagerProps {
  // Add any props if needed in the future
}
