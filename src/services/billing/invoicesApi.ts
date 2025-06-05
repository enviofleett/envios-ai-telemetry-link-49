
import { supabase } from '@/integrations/supabase/client';
import { Invoice } from '@/types/billing';

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
    return (data || []) as Invoice[];
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
    return data as Invoice | null;
  },

  async getOverdueInvoices(): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('status', 'overdue')
      .order('due_date');

    if (error) throw error;
    return (data || []) as Invoice[];
  }
};
