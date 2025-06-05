
import { supabase } from '@/integrations/supabase/client';
import { 
  ServicePlan, 
  DeviceSubscription, 
  Invoice, 
  PaymentMethod, 
  CreateSubscriptionRequest, 
  UpdateSubscriptionRequest,
  BillingDashboardStats
} from '@/types/billing';

export const billingApi = {
  // Service Plans
  async getServicePlans(): Promise<ServicePlan[]> {
    const { data, error } = await supabase
      .from('service_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;
    return data || [];
  },

  async getServicePlan(id: string): Promise<ServicePlan | null> {
    const { data, error } = await supabase
      .from('service_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Device Subscriptions
  async getDeviceSubscriptions(): Promise<DeviceSubscription[]> {
    const { data, error } = await supabase
      .from('device_subscriptions')
      .select(`
        *,
        service_plan:service_plans(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getDeviceSubscription(id: string): Promise<DeviceSubscription | null> {
    const { data, error } = await supabase
      .from('device_subscriptions')
      .select(`
        *,
        service_plan:service_plans(*)
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getDeviceSubscriptionByDeviceId(deviceId: string): Promise<DeviceSubscription | null> {
    const { data, error } = await supabase
      .from('device_subscriptions')
      .select(`
        *,
        service_plan:service_plans(*)
      `)
      .eq('device_id', deviceId)
      .eq('subscription_status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async createDeviceSubscription(subscription: CreateSubscriptionRequest): Promise<DeviceSubscription> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('device_subscriptions')
      .insert({
        ...subscription,
        customer_id: user.id,
        auto_renewal: subscription.auto_renewal ?? true,
        discount_percentage: subscription.discount_percentage ?? 0
      })
      .select(`
        *,
        service_plan:service_plans(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async updateDeviceSubscription(id: string, updates: UpdateSubscriptionRequest): Promise<DeviceSubscription> {
    const { data, error } = await supabase
      .from('device_subscriptions')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        service_plan:service_plans(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async cancelDeviceSubscription(id: string): Promise<DeviceSubscription> {
    return this.updateDeviceSubscription(id, { 
      subscription_status: 'cancelled',
      auto_renewal: false 
    });
  },

  async renewDeviceSubscription(id: string, newEndDate: string): Promise<DeviceSubscription> {
    return this.updateDeviceSubscription(id, { 
      end_date: newEndDate,
      subscription_status: 'active' 
    });
  },

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        line_items:invoice_line_items(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getInvoice(id: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        line_items:invoice_line_items(*)
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getOverdueInvoices(): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('status', 'overdue')
      .order('due_date');

    if (error) throw error;
    return data || [];
  },

  // Payment Methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async addPaymentMethod(paymentMethod: Partial<PaymentMethod>): Promise<PaymentMethod> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('payment_methods')
      .insert({
        ...paymentMethod,
        customer_id: user.id,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async setDefaultPaymentMethod(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // First, unset all default payment methods for the user
    await supabase
      .from('payment_methods')
      .update({ is_default: false })
      .eq('customer_id', user.id);

    // Then set the selected one as default
    const { error } = await supabase
      .from('payment_methods')
      .update({ is_default: true })
      .eq('id', id)
      .eq('customer_id', user.id);

    if (error) throw error;
  },

  // Dashboard Stats
  async getBillingDashboardStats(): Promise<BillingDashboardStats> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get active subscriptions count
    const { data: activeSubscriptions } = await supabase
      .from('device_subscriptions')
      .select('id', { count: 'exact' })
      .eq('customer_id', user.id)
      .eq('subscription_status', 'active');

    // Get pending invoices count
    const { data: pendingInvoices } = await supabase
      .from('invoices')
      .select('id', { count: 'exact' })
      .eq('customer_id', user.id)
      .eq('status', 'sent');

    // Get overdue invoices count
    const { data: overdueInvoices } = await supabase
      .from('invoices')
      .select('id', { count: 'exact' })
      .eq('customer_id', user.id)
      .eq('status', 'overdue');

    // Get total revenue (sum of paid invoices)
    const { data: paidInvoices } = await supabase
      .from('invoices')
      .select('total_amount')
      .eq('customer_id', user.id)
      .eq('status', 'paid');

    const totalRevenue = paidInvoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

    // Calculate monthly recurring revenue (simplified)
    const { data: monthlySubscriptions } = await supabase
      .from('device_subscriptions')
      .select('service_plan:service_plans(price_1_year)')
      .eq('customer_id', user.id)
      .eq('subscription_status', 'active')
      .eq('billing_cycle', 'annual');

    const mrr = monthlySubscriptions?.reduce((sum, sub) => {
      const annualPrice = sub.service_plan?.price_1_year || 0;
      return sum + (annualPrice / 12);
    }, 0) || 0;

    return {
      total_revenue: totalRevenue,
      monthly_recurring_revenue: mrr,
      active_subscriptions: activeSubscriptions?.length || 0,
      pending_invoices: pendingInvoices?.length || 0,
      overdue_invoices: overdueInvoices?.length || 0,
      churn_rate: 0, // Would need more complex calculation
      revenue_growth: 0 // Would need historical data
    };
  }
};
