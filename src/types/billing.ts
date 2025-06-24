
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
  // Missing properties that were causing errors
  subscription_status: 'active' | 'paused' | 'cancelled' | 'expired';
  billing_cycle: 'monthly' | 'quarterly' | 'annually';
  auto_renewal: boolean;
  discount_percentage?: number;
}

export interface ServicePlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  billing_cycle: string;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  type: 'card' | 'bank' | 'wallet';
  last_four?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface BillingDashboardStats {
  total_revenue: number;
  monthly_recurring_revenue: number;
  active_subscriptions: number;
  pending_invoices: number;
  overdue_invoices: number;
  churn_rate: number;
  revenue_growth: number;
}

export interface CreateSubscriptionRequest {
  device_id: string;
  plan_id: string;
  billing_cycle: 'monthly' | 'quarterly' | 'annually';
  auto_renewal?: boolean;
}

export interface UpdateSubscriptionRequest {
  subscription_status?: 'active' | 'paused' | 'cancelled';
  billing_cycle?: 'monthly' | 'quarterly' | 'annually';
  auto_renewal?: boolean;
  end_date?: string;
}
