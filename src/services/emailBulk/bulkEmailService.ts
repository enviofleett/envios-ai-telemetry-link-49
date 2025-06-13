
import { supabase } from '@/integrations/supabase/client';
import { emailTriggerService } from '@/services/emailTriggers/emailTriggerService';

export interface BulkEmailOperation {
  id: string;
  operation_type: 'send_bulk' | 'import_recipients' | 'export_analytics';
  operation_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  total_items: number;
  processed_items: number;
  successful_items: number;
  failed_items: number;
  created_by: string;
  created_at: string;
  completed_at?: string;
  error_log?: any[];
  operation_data: any;
}

export interface BulkEmailRequest {
  recipients: Array<{
    email: string;
    name?: string;
    variables?: Record<string, string>;
  }>;
  template_id?: string;
  subject: string;
  message: string;
  send_immediately?: boolean;
  scheduled_for?: string;
}

class BulkEmailService {
  async createBulkEmailOperation(operationData: Partial<BulkEmailOperation>): Promise<BulkEmailOperation> {
    const { data, error } = await (supabase as any)
      .from('bulk_email_operations')
      .insert({
        ...operationData,
        created_by: (await supabase.auth.getUser()).data.user?.id,
        status: 'pending',
        processed_items: 0,
        successful_items: 0,
        failed_items: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data as BulkEmailOperation;
  }

  async processBulkEmail(request: BulkEmailRequest): Promise<BulkEmailOperation> {
    // Create operation record
    const operation = await this.createBulkEmailOperation({
      operation_type: 'send_bulk',
      operation_name: `Bulk Email: ${request.subject}`,
      total_items: request.recipients.length,
      operation_data: {
        subject: request.subject,
        message: request.message,
        template_id: request.template_id,
        scheduled_for: request.scheduled_for
      }
    });

    try {
      // Update status to processing
      await this.updateOperation(operation.id, { status: 'processing' });

      if (request.send_immediately !== false) {
        // Process immediately
        await this.executeBulkSend(operation.id, request);
      } else {
        // Schedule for later (would integrate with a job queue in production)
        console.log(`Bulk email scheduled for: ${request.scheduled_for}`);
      }

      return operation;
    } catch (error) {
      await this.updateOperation(operation.id, { 
        status: 'failed',
        error_log: [{ error: error instanceof Error ? error.message : 'Unknown error', timestamp: new Date().toISOString() }]
      });
      throw error;
    }
  }

  private async executeBulkSend(operationId: string, request: BulkEmailRequest): Promise<void> {
    let processedCount = 0;
    let successCount = 0;
    let failedCount = 0;
    const errorLog: any[] = [];

    for (const recipient of request.recipients) {
      try {
        await emailTriggerService.sendTriggeredEmail({
          to: recipient.email,
          trigger_type: 'bulk_operation',
          template_variables: {
            user_name: recipient.name || recipient.email,
            ...recipient.variables || {}
          },
          related_entity_id: operationId,
          fallback_subject: request.subject,
          fallback_message: request.message
        });

        successCount++;
      } catch (error) {
        failedCount++;
        errorLog.push({
          recipient: recipient.email,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }

      processedCount++;

      // Update progress every 10 emails
      if (processedCount % 10 === 0) {
        await this.updateOperation(operationId, {
          processed_items: processedCount,
          successful_items: successCount,
          failed_items: failedCount
        });
      }

      // Small delay to avoid overwhelming the email service
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Final update
    await this.updateOperation(operationId, {
      status: failedCount === 0 ? 'completed' : 'failed',
      processed_items: processedCount,
      successful_items: successCount,
      failed_items: failedCount,
      completed_at: new Date().toISOString(),
      error_log: errorLog.length > 0 ? errorLog : undefined
    });
  }

  async getBulkOperations(): Promise<BulkEmailOperation[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('bulk_email_operations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BulkEmailOperation[] || [];
    } catch (error) {
      console.warn('Bulk operations not available:', error);
      return [];
    }
  }

  async getBulkOperation(id: string): Promise<BulkEmailOperation | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('bulk_email_operations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as BulkEmailOperation;
    } catch (error) {
      console.warn('Bulk operation not found:', error);
      return null;
    }
  }

  private async updateOperation(id: string, updates: Partial<BulkEmailOperation>): Promise<void> {
    const { error } = await (supabase as any)
      .from('bulk_email_operations')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  }

  async cancelBulkOperation(id: string): Promise<void> {
    await this.updateOperation(id, { 
      status: 'cancelled',
      completed_at: new Date().toISOString()
    });
  }

  async importRecipientsFromCSV(csvData: string): Promise<Array<{email: string, name?: string}>> {
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const emailIndex = headers.findIndex(h => h.includes('email'));
    const nameIndex = headers.findIndex(h => h.includes('name'));
    
    if (emailIndex === -1) {
      throw new Error('CSV must contain an email column');
    }

    const recipients: Array<{email: string, name?: string}> = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const email = values[emailIndex];
      
      if (email && this.isValidEmail(email)) {
        recipients.push({
          email,
          name: nameIndex !== -1 ? values[nameIndex] : undefined
        });
      }
    }

    return recipients;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

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

export const bulkEmailService = new BulkEmailService();
