
import { supabase } from '@/integrations/supabase/client';
import { BillingDashboardStats } from '@/types/billing';

export const dashboardStatsApi = {
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

    const mrr = monthlySubscriptions?.reduce((sum, sub: any) => {
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
