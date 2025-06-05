
export interface ServicePlan {
  id: string;
  plan_name: string;
  plan_code: string;
  description?: string;
  price_1_year?: number;
  price_3_year?: number;
  price_5_year?: number;
  price_10_year?: number;
  features: Record<string, any>;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DeviceSubscription {
  id: string;
  device_id: string;
  service_plan_id?: string;
  customer_id?: string;
  subscription_status: 'active' | 'suspended' | 'cancelled' | 'expired';
  billing_cycle: 'monthly' | 'quarterly' | 'annual';
  start_date: string;
  end_date: string;
  auto_renewal: boolean;
  price_override?: number;
  discount_percentage: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  service_plan?: ServicePlan;
}

export interface BillingCycle {
  id: string;
  customer_id?: string;
  cycle_start_date: string;
  cycle_end_date: string;
  billing_date: string;
  status: 'pending' | 'processed' | 'failed';
  total_amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id?: string;
  billing_cycle_id?: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  payment_date?: string;
  payment_method?: string;
  stripe_invoice_id?: string;
  invoice_data: Record<string, any>;
  created_at: string;
  updated_at: string;
  line_items?: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  id: string;
  invoice_id?: string;
  device_subscription_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  period_start?: string;
  period_end?: string;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  customer_id?: string;
  stripe_payment_method_id?: string;
  method_type: string;
  is_default: boolean;
  card_last_four?: string;
  card_brand?: string;
  card_exp_month?: number;
  card_exp_year?: number;
  billing_address: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionHistory {
  id: string;
  device_subscription_id?: string;
  action_type: 'created' | 'renewed' | 'suspended' | 'cancelled' | 'reactivated';
  action_description?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  performed_by?: string;
  created_at: string;
}

export interface BillingNotification {
  id: string;
  customer_id?: string;
  notification_type: string;
  subject: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  scheduled_for?: string;
  sent_at?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface CreateSubscriptionRequest {
  device_id: string;
  service_plan_id: string;
  billing_cycle: 'monthly' | 'quarterly' | 'annual';
  start_date: string;
  end_date: string;
  auto_renewal?: boolean;
  price_override?: number;
  discount_percentage?: number;
  notes?: string;
}

export interface UpdateSubscriptionRequest {
  service_plan_id?: string;
  subscription_status?: 'active' | 'suspended' | 'cancelled' | 'expired';
  billing_cycle?: 'monthly' | 'quarterly' | 'annual';
  end_date?: string;
  auto_renewal?: boolean;
  price_override?: number;
  discount_percentage?: number;
  notes?: string;
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
