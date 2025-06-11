
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

// Encryption utility for secure credential storage
class CredentialEncryption {
  private static async getEncryptionKey(): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode('envio-sms-encryption-key-v1'),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('envio-salt'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  static async encrypt(plaintext: string): Promise<string> {
    const key = await this.getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );
    
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  }

  static async decrypt(encryptedData: string): Promise<string> {
    try {
      const key = await this.getEncryptionKey();
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );
      
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );
      
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt credentials');
    }
  }
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
    console.log('💾 Saving SMS configuration with encryption...');
    
    try {
      // Encrypt the password before saving
      const encryptedPassword = await CredentialEncryption.encrypt(config.password);
      
      const { data, error } = await supabase
        .from('sms_configurations')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          provider_name: 'mysms',
          api_username: config.username, // Fixed: use api_username to match schema
          api_password_encrypted: encryptedPassword, // Fixed: use api_password_encrypted to match schema
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

      console.log('✅ SMS configuration saved successfully with encryption');
      return data;
    } catch (error) {
      console.error('❌ Failed to save SMS configuration:', error);
      throw error;
    }
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

    // Decrypt password if configuration exists
    if (data && data.api_password_encrypted) {
      try {
        const decryptedPassword = await CredentialEncryption.decrypt(data.api_password_encrypted);
        return {
          ...data,
          password_decrypted: decryptedPassword // Provide decrypted password for internal use
        };
      } catch (error) {
        console.error('Failed to decrypt password:', error);
        throw new Error('Failed to decrypt stored credentials');
      }
    }

    return data;
  }

  // Enhanced phone validation with international support
  validatePhoneNumber(phone: string): boolean {
    // E.164 format validation with enhanced patterns
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    const nigeriaMobileRegex = /^(\+234|234|0)?[789][01]\d{8}$/;
    
    // Check E.164 first
    if (e164Regex.test(phone)) {
      return true;
    }
    
    // Check Nigerian mobile format
    if (nigeriaMobileRegex.test(phone.replace(/\s+/g, ''))) {
      return true;
    }
    
    return false;
  }

  formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters except +
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // Handle Nigerian numbers specifically
    if (cleaned.match(/^0[789][01]\d{8}$/)) {
      return `+234${cleaned.substring(1)}`;
    }
    
    // Handle numbers that start with 234 but no +
    if (cleaned.match(/^234[789][01]\d{8}$/)) {
      return `+${cleaned}`;
    }
    
    // Add + prefix if not present and looks like international format
    if (!cleaned.startsWith('+') && cleaned.length > 10) {
      return `+${cleaned}`;
    }
    
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  }

  // New: SMS delivery confirmation tracking
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

  // New: Bulk SMS sending for fleet notifications
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

  // New: SMS template support
  async sendTemplatedSMS(recipient: string, templateName: string, variables: Record<string, string>) {
    console.log(`📝 Sending templated SMS using template: ${templateName}`);
    
    // This would typically fetch templates from database
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
    
    // Replace variables in template
    Object.entries(variables).forEach(([key, value]) => {
      message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    
    return this.sendSMS(recipient, message, 'TEMPLATED');
  }
}

export const smsService = new SMSService();
