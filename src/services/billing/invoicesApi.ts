
import { supabase } from '@/integrations/supabase/client';
import { Invoice } from '@/types/billing';

// Transform database invoice to application invoice
const transformInvoice = (dbInvoice: any): Invoice => ({
  id: dbInvoice.id,
  customer_id: dbInvoice.customer_id,
  billing_cycle_id: dbInvoice.billing_cycle_id,
  total_amount: dbInvoice.total_amount,
  currency: dbInvoice.currency,
  status: dbInvoice.status,
  due_date: dbInvoice.due_date,
  invoice_date: dbInvoice.invoice_date,
  invoice_number: dbInvoice.invoice_number,
  payment_date: dbInvoice.payment_date,
  created_at: dbInvoice.created_at,
  updated_at: dbInvoice.updated_at
});

export const invoicesApi = {
  async getInvoices(): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        line_items:invoice_line_items(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformInvoice);
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
    return data ? transformInvoice(data) : null;
  },

  async getOverdueInvoices(): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('status', 'overdue')
      .order('due_date');

    if (error) throw error;
    return (data || []).map(transformInvoice);
  }
};
