
import { supabase } from '@/integrations/supabase/client';

export class AnalyticsExporter {
  async exportAnalytics(dateRange: { from: Date; to: Date }): Promise<string> {
    const { data, error } = await supabase
      .from('email_delivery_logs')
      .select('*')
      .gte('created_at', dateRange.from.toISOString())
      .lte('created_at', dateRange.to.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Convert to CSV
    const headers = ['Date', 'Recipient', 'Subject', 'Status', 'Trigger Type'];
    const csvContent = [
      headers.join(','),
      ...(data || []).map(row => [
        new Date(row.created_at).toLocaleString(),
        row.recipient_email,
        `"${row.subject}"`,
        row.status,
        row.trigger_type || 'N/A'
      ].join(','))
    ].join('\n');

    return csvContent;
  }
}
