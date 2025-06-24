
export interface BillingDashboardStats {
  total_revenue: number;
  revenue_growth: number;
  monthly_recurring_revenue: number;
  active_subscriptions: number;
  pending_invoices: number;
}

export interface DeviceSubscription {
  id: string;
  device_id: string;
  user_id: string;
  subscription_type: string;
  status: string;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export const fetchBillingDashboardStats = async (): Promise<BillingDashboardStats> => {
  try {
    // Mock data since actual billing tables may not be fully set up
    return {
      total_revenue: 125780,
      revenue_growth: 12.5,
      monthly_recurring_revenue: 15600,
      active_subscriptions: 890,
      pending_invoices: 23
    };
  } catch (error) {
    console.error('Error fetching billing dashboard stats:', error);
    return {
      total_revenue: 0,
      revenue_growth: 0,
      monthly_recurring_revenue: 0,
      active_subscriptions: 0,
      pending_invoices: 0
    };
  }
};

export const fetchDeviceSubscriptions = async (): Promise<DeviceSubscription[]> => {
  try {
    // Mock data since device_subscriptions table may not be fully set up
    return [];
  } catch (error) {
    console.error('Error fetching device subscriptions:', error);
    return [];
  }
};
