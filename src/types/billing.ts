export interface DeviceSubscription {
  id: string;
  device_id: string;
  user_id: string;
  subscription_type: string;
  status: string;
  subscription_status: 'active' | 'paused' | 'cancelled' | 'expired';
  billing_cycle: 'monthly' | 'quarterly' | 'annually';
  auto_renewal: boolean;
  start_date: string;
  end_date?: string;
  price_override?: number;
  discount_percentage?: number;
  created_at: string;
  updated_at: string;
}

export interface ServicePlan {
  id: string;
  plan_name: string;
  description?: string;
  plan_code: string;
  price_1_year: number;
  price_3_year: number;
  price_5_year: number;
  price_10_year: number;
  features: any;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  customer_id: string;
  billing_cycle_id: string;
  total_amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  invoice_date: string;
  invoice_number: string;
  payment_date?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  customer_id: string;
  method_type: 'card' | 'bank' | 'wallet';
  stripe_payment_method_id?: string;
  card_last_four?: string;
  card_brand?: string;
  card_exp_month?: number;
  card_exp_year?: number;
  billing_address?: any;
  is_default: boolean;
  is_active: boolean;
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
