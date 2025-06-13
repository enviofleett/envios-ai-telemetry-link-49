
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export interface DeliveryLog {
  email_template_id?: string;
  recipient_email: string;
  subject: string;
  status: 'QUEUED' | 'SENDING' | 'SENT' | 'FAILED';
  error_message?: string;
  sent_at?: string;
  trigger_type?: string;
  related_entity_id?: string;
  template_variables?: Record<string, any>;
}

export class DeliveryLogger {
  private supabase;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async createDeliveryLog(logData: DeliveryLog): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('email_delivery_logs')
        .insert({
          ...logData,
          template_variables: logData.template_variables || {}
        })
        .select('id')
        .single();

      if (error) {
        console.error('❌ Failed to create delivery log:', error);
        return null;
      }

      console.log(`📝 Created delivery log: ${data.id}`);
      return data.id;
    } catch (error) {
      console.error('❌ Delivery log creation exception:', error);
      return null;
    }
  }

  async updateDeliveryLog(
    logId: string, 
    updates: Partial<DeliveryLog>
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('email_delivery_logs')
        .update(updates)
        .eq('id', logId);

      if (error) {
        console.error('❌ Failed to update delivery log:', error);
        return false;
      }

      console.log(`📝 Updated delivery log: ${logId}`);
      return true;
    } catch (error) {
      console.error('❌ Delivery log update exception:', error);
      return false;
    }
  }

  async logSuccess(logId: string): Promise<void> {
    await this.updateDeliveryLog(logId, {
      status: 'SENT',
      sent_at: new Date().toISOString()
    });
  }

  async logFailure(logId: string, errorMessage: string): Promise<void> {
    await this.updateDeliveryLog(logId, {
      status: 'FAILED',
      error_message: errorMessage
    });
  }
}
