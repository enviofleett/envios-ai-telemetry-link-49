
// Types for enhanced CSV import functionality
export interface EnhancedImportPreviewData {
  summary: {
    total_rows: number;
    valid_rows: number;
    invalid_rows: number;
    unique_users: number;
    unique_devices: number;
    conflicts: number;
  };
  valid_rows: Array<{
    user_name: string;
    user_email: string;
    gp51_username?: string;
    generated_username?: string;
    device_id: string;
    device_name: string;
    assignment_type: string;
    validation_flags?: string[];
  }>;
  invalid_rows: any[];
  conflicts: Array<{
    row_number: number;
    conflict_type: string;
    suggested_resolution?: string;
  }>;
  gp51_validation: {
    auto_generated_usernames: number;
    username_conflicts: number;
    device_type_issues: number;
  };
}
