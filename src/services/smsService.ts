
import { supabase } from '@/integrations/supabase/client';

export interface SMSConfig {
  username: string;
  password: string;
  sender: string;
  route: number;
}

export interface SMSLog {
  id: string;
  recipient_phone: string;
  message: string;
  event_type: string;
  status: string;
  provider_name: string;
  provider_response: any;
  sent_at: string | null;
  failed_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface SMSLogsResponse {
  success: boolean;
  logs: SMSLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface BalanceResponse {
  success: boolean;
  balance?: string;
  error?: string;
}

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
      // Construct the validation URL for balance check
      const validationUrl = `https://sms.mysmstab.com/api/?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=balance`;
      
      const response = await fetch(validationUrl);
      const data = await response.json();
      
      console.log('📊 Balance API response:', data);
      
      // Check if the API returned an error
      if (data.error) {
        console.error('❌ Validation failed:', data.error);
        return {
          success: false,
          error: data.error
        };
      }
      
      // Success case - credentials are valid
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
    
    // Step 1: Validate credentials using balance check
    const validationResult = await this.validateCredentials(config.username, config.password);
    
    if (!validationResult.success) {
      return {
        success: false,
        message: validationResult.error || 'Credential validation failed'
      };
    }
    
    // Step 2: Save credentials to database if validation passed
    try {
      console.log('💾 Saving validated credentials to database...');
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

  async testConfiguration(config: SMSConfig, testRecipient?: string) {
    console.log('🧪 Testing SMS configuration');
    
    return this.makeRequest({
      action: 'test_config',
      config,
      recipient: testRecipient
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
    console.log('💾 Saving SMS configuration');
    
    const { data, error } = await supabase
      .from('sms_configurations')
      .upsert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        provider_name: 'mysms',
        username: config.username,
        password_encrypted: config.password,
        sender_id: config.sender,
        route: config.route.toString(),
        is_active: true,
        is_default: true
      }, {
        onConflict: 'user_id,provider_name'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save SMS configuration: ${error.message}`);
    }

    return data;
  }

  async getSMSConfiguration() {
    console.log('📖 Getting SMS configuration');
    
    const { data, error } = await supabase
      .from('sms_configurations')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get SMS configuration: ${error.message}`);
    }

    return data;
  }

  validatePhoneNumber(phone: string): boolean {
    // E.164 format validation
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  }

  formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Add + prefix if not present
    if (!phone.startsWith('+')) {
      // Assume Nigerian number if 11 digits starting with 0
      if (cleaned.length === 11 && cleaned.startsWith('0')) {
        return `+234${cleaned.substring(1)}`;
      }
      // Add + prefix for other formats
      return `+${cleaned}`;
    }
    
    return phone;
  }
}

export const smsService = new SMSService();
