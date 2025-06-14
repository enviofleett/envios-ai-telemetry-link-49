
// New file for admin dashboard types
export interface PackageAnalytics {
  id: string;
  package_id: string;
  subscribers_count: number;
  revenue: number;
  period_start: string;
  period_end: string;
  created_at: string;
}

export interface SubscriptionMigrationLog {
  id: string;
  user_subscription_id: string;
  previous_package_id?: string;
  new_package_id?: string;
  migrated_at: string;
  migrated_by?: string;
  notes?: string;
}

// Add more types if needed for advanced admin flows
