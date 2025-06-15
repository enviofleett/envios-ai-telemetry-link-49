import { supabase } from '@/integrations/supabase/client';
import { SMSConfig, SMSLog, SMSLogsResponse, BalanceResponse } from './smsService';

export type { SMSConfig, SMSLog, SMSLogsResponse, BalanceResponse };

// Client-side encryption has been removed for better security.
// All credential handling is now done server-side via Edge Functions.

class SMSService {
  private async makeRequest(data: any) {
    const { data: response, error } = await supabase.functions.invoke('sms-gateway', {
      body: data
    });

    if (error) {
      throw new Error(error.message);
    }

    return response;
  }

  async validateCredentials(username: string, password: string): Promise<BalanceResponse> {
    console.log('🔍 Validating SMS credentials using balance check...');
    
    try {
      // This remains a client-side check for immediate feedback before saving.
      const validationUrl = `https://sms.mysmstab.com/api/?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=balance`;
      
      const response = await fetch(validationUrl);
      const data = await response.json();
      
      console.log('📊 Balance API response:', data);
      
      if (data.error) {
        console.error('❌ Validation failed:', data.error);
        return {
          success: false,
          error: data.error
        };
      }
      
      console.log('✅ Credentials validated successfully');
      return {
        success: true,
        balance: data.balance || 'Available'
      };
      
    } catch (error) {
      console.error('❌ Network error during validation:', error);
      return {
        success: false,
        error: 'Could not connect to SMS service. Please check your internet connection.'
      };
    }
  }

  async validateAndSaveCredentials(config: SMSConfig): Promise<{ success: boolean; message: string; balance?: string }> {
    console.log('🧪 Starting credential validation and save process...');
    
    const validationResult = await this.validateCredentials(config.username, config.password);
    
    if (!validationResult.success) {
      return {
        success: false,
        message: validationResult.error || 'Credential validation failed'
      };
    }
    
    try {
      console.log('💾 Saving validated credentials to database via edge function...');
      await this.saveSMSConfiguration(config);
      
      return {
        success: true,
        message: 'Credentials verified and saved successfully!',
        balance: validationResult.balance
      };
      
    } catch (error) {
      console.error('❌ Failed to save credentials after validation:', error);
      return {
        success: false,
        message: `Credentials are valid but failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async sendSMS(recipient: string, message: string, eventType: string = 'CUSTOM') {
    console.log(`📱 Sending SMS to ${recipient}: ${message}`);
    
    return this.makeRequest({
      action: 'send_sms',
      recipient,
      message,
      event_type: eventType
    });
  }

  async getSMSLogs(page: number = 1, limit: number = 50): Promise<SMSLogsResponse> {
    console.log(`📋 Fetching SMS logs - Page ${page}`);
    
    return this.makeRequest({
      action: 'get_logs',
      page,
      limit
    });
  }

  async saveSMSConfiguration(config: SMSConfig) {
    console.log('💾 Calling edge function to save SMS configuration...');
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User must be authenticated to save SMS settings.");

        const { data, error } = await supabase.functions.invoke('settings-management', {
            body: {
                action: 'save-sms-settings',
                userId: user.id,
                username: config.username,
                password: config.password,
                sender: config.sender,
                route: config.route
            }
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error);

        console.log('✅ SMS configuration saved successfully via edge function');
        return data.data;
    } catch (error) {
        console.error('❌ Failed to save SMS configuration via edge function:', error);
        throw error;
    }
  }

  async getSMSConfiguration() {
    console.log('📖 Getting SMS configuration via edge function...');
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase.functions.invoke('settings-management', {
            body: { action: 'get-sms-settings' }
        });

        if (error) throw error;

        if (data && data.success) {
            return data.data;
        }
        return null;
    } catch (error) {
        console.error('Failed to get SMS configuration:', error);
        return null;
    }
  }

  async getProviderBalance(): Promise<BalanceResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('sms-gateway', {
        body: { action: 'get_balance' }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching SMS provider balance:', error);
      return { success: false, error: 'Failed to fetch balance.' };
    }
  }

  validatePhoneNumber(phone: string): boolean {
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    const nigeriaMobileRegex = /^(\+234|234|0)?[789][01]\d{8}$/;
    
    if (e164Regex.test(phone)) {
      return true;
    }
    
    if (nigeriaMobileRegex.test(phone.replace(/\s+/g, ''))) {
      return true;
    }
    
    return false;
  }

  formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    if (cleaned.match(/^0[789][01]\d{8}$/)) {
      return `+234${cleaned.substring(1)}`;
    }
    
    if (cleaned.match(/^234[789][01]\d{8}$/)) {
      return `+${cleaned}`;
    }
    
    if (!cleaned.startsWith('+') && cleaned.length > 10) {
      return `+${cleaned}`;
    }
    
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  }

  async updateSMSStatus(smsLogId: string, status: string, deliveryDetails?: any) {
    console.log(`📊 Updating SMS status for ${smsLogId}: ${status}`);
    
    const { error } = await supabase
      .from('sms_logs')
      .update({
        status,
        provider_response: deliveryDetails || {},
        updated_at: new Date().toISOString()
      })
      .eq('id', smsLogId);

    if (error) {
      console.error('Failed to update SMS status:', error);
      throw error;
    }
  }

  async sendBulkSMS(recipients: string[], message: string, eventType: string = 'FLEET_NOTIFICATION') {
    console.log(`📢 Sending bulk SMS to ${recipients.length} recipients`);
    
    const results = [];
    for (const recipient of recipients) {
      try {
        const result = await this.sendSMS(recipient, message, eventType);
        results.push({ recipient, success: true, result });
      } catch (error) {
        results.push({ 
          recipient, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return results;
  }

  async sendTemplatedSMS(recipient: string, templateName: string, variables: Record<string, string>) {
    console.log(`📝 Sending templated SMS using template: ${templateName}`);
    
    const templates = {
      'vehicle_alert': 'Alert: Your vehicle {{vehicle_id}} has {{alert_type}}. Location: {{location}}',
      'maintenance_reminder': 'Reminder: {{vehicle_id}} is due for {{service_type}} on {{due_date}}',
      'geofence_violation': 'Alert: Vehicle {{vehicle_id}} has {{violation_type}} geofence {{geofence_name}}',
      'trip_update': 'Trip Update: {{vehicle_id}} - {{status}}. ETA: {{eta}}'
    };
    
    let message = templates[templateName as keyof typeof templates];
    if (!message) {
      throw new Error(`SMS template '${templateName}' not found`);
    }
    
    Object.entries(variables).forEach(([key, value]) => {
      message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    
    return this.sendSMS(recipient, message, 'TEMPLATED');
  }
}

export const smsService = new SMSService();
