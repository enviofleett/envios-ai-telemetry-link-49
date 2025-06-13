
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

export interface SMTPConfig {
  hostname: string;
  port: number;
  username: string;
  password: string;
  encryption: string;
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
}

export class EmailSender {
  private config: SMTPConfig;

  constructor(config: SMTPConfig) {
    this.config = config;
  }

  private validateConfig(): void {
    const errors: string[] = [];

    // Validate hostname
    if (!this.config.hostname || this.config.hostname.trim() === '') {
      errors.push('SMTP hostname is required');
    } else if (!this.config.hostname.includes('.')) {
      errors.push('SMTP hostname appears to be invalid (should be like smtp.domain.com)');
    }

    // Validate username (should be email format)
    if (!this.config.username || this.config.username.trim() === '') {
      errors.push('SMTP username is required');
    } else if (!this.config.username.includes('@')) {
      errors.push('SMTP username should be an email address');
    }

    // Validate password
    if (!this.config.password || this.config.password.trim() === '') {
      errors.push('SMTP password is required');
    }

    // Validate port
    if (!this.config.port || this.config.port < 1 || this.config.port > 65535) {
      errors.push('SMTP port must be between 1 and 65535');
    }

    if (errors.length > 0) {
      throw new Error(`SMTP Configuration Validation Failed: ${errors.join(', ')}`);
    }
  }

  private getConnectionConfig() {
    // Determine SSL/TLS based on encryption setting and port
    let useSSL = false;
    let useTLS = false;

    if (this.config.encryption === 'ssl' || this.config.port === 465) {
      useSSL = true;
      useTLS = false;
    } else if (this.config.encryption === 'tls' || this.config.port === 587) {
      useSSL = false;
      useTLS = true;
    } else if (this.config.encryption === 'none') {
      useSSL = false;
      useTLS = false;
    } else {
      // Default behavior for common ports
      if (this.config.port === 465) {
        useSSL = true;
        useTLS = false;
      } else if (this.config.port === 587 || this.config.port === 25) {
        useSSL = false;
        useTLS = true;
      }
    }

    console.log(`📧 SMTP Connection Config:`, {
      hostname: this.config.hostname,
      port: this.config.port,
      encryption: this.config.encryption,
      useSSL,
      useTLS,
      username: this.config.username
    });

    return {
      hostname: this.config.hostname,
      port: this.config.port,
      tls: useTLS,
      auth: {
        username: this.config.username,
        password: this.config.password,
      },
    };
  }

  async sendEmail(message: EmailMessage): Promise<void> {
    // Validate configuration before attempting to send
    this.validateConfig();

    const connectionConfig = this.getConnectionConfig();
    const client = new SMTPClient({
      connection: connectionConfig,
    });

    console.log(`📧 Attempting to send email to: ${message.to}`);
    console.log(`📧 Subject: ${message.subject}`);
    console.log(`📧 SMTP Server: ${this.config.hostname}:${this.config.port}`);
    console.log(`📧 Encryption: ${this.config.encryption}`);

    try {
      await client.send({
        from: message.from || this.config.username,
        to: message.to,
        subject: message.subject,
        content: message.text,
        html: message.html,
      });

      console.log(`✅ Email sent successfully to: ${message.to}`);
    } catch (error) {
      console.error(`❌ Failed to send email to ${message.to}:`, error);
      
      // Provide more specific error messages based on common failure patterns
      let errorMessage = 'Failed to send email';
      if (error instanceof Error) {
        const errorText = error.message.toLowerCase();
        
        if (errorText.includes('authentication') || errorText.includes('login') || errorText.includes('credential')) {
          errorMessage = `Authentication failed: Check your SMTP username (${this.config.username}) and password. Make sure they are correct for your email provider.`;
        } else if (errorText.includes('connection') || errorText.includes('network') || errorText.includes('timeout')) {
          errorMessage = `Connection failed: Cannot connect to SMTP server ${this.config.hostname}:${this.config.port}. Check if the hostname is correct (should be like smtp.gmail.com, not just gmail.com).`;
        } else if (errorText.includes('ssl') || errorText.includes('tls') || errorText.includes('certificate')) {
          errorMessage = `SSL/TLS error: Check your encryption settings. Port 465 typically uses SSL, port 587 uses TLS.`;
        } else if (errorText.includes('port') || errorText.includes('refused')) {
          errorMessage = `Port error: Port ${this.config.port} may be blocked or incorrect. Try port 587 for TLS or 465 for SSL.`;
        } else {
          errorMessage = `SMTP Error: ${error.message}`;
        }
      }
      
      throw new Error(errorMessage);
    } finally {
      await client.close();
    }
  }

  static async loadConfig(supabase: any): Promise<SMTPConfig | null> {
    try {
      const { data: settings, error } = await supabase
        .from('smtp_settings')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error || !settings) {
        console.error('❌ Failed to load SMTP settings:', error);
        return null;
      }

      console.log('📧 Loaded SMTP settings:', {
        host: settings.smtp_host,
        port: settings.smtp_port,
        username: settings.smtp_username,
        encryption: settings.smtp_encryption,
        hasPassword: !!settings.smtp_password
      });

      if (!settings.smtp_host || !settings.smtp_port || !settings.smtp_username || !settings.smtp_password) {
        console.error('❌ Incomplete SMTP configuration - missing required fields');
        return null;
      }

      return {
        hostname: settings.smtp_host,
        port: settings.smtp_port,
        username: settings.smtp_username,
        password: settings.smtp_password,
        encryption: settings.smtp_encryption || 'tls',
      };
    } catch (error) {
      console.error('❌ Exception loading SMTP config:', error);
      return null;
    }
  }
}
