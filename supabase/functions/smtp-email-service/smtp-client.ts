
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

export interface SMTPConfig {
  hostname: string;
  port: number;
  username: string;
  password: string;
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

  async sendEmail(message: EmailMessage): Promise<void> {
    const client = new SMTPClient({
      connection: {
        hostname: this.config.hostname,
        port: this.config.port,
        tls: this.config.port === 465,
        auth: {
          username: this.config.username,
          password: this.config.password,
        },
      },
    });

    console.log(`📧 Attempting to send email to: ${message.to}`);
    console.log(`📧 Subject: ${message.subject}`);
    console.log(`📧 SMTP Server: ${this.config.hostname}:${this.config.port}`);

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
      throw error;
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

      if (!settings.smtp_host || !settings.smtp_port || !settings.smtp_username || !settings.smtp_password) {
        console.error('❌ Incomplete SMTP configuration');
        return null;
      }

      return {
        hostname: settings.smtp_host,
        port: settings.smtp_port,
        username: settings.smtp_username,
        password: settings.smtp_password,
      };
    } catch (error) {
      console.error('❌ Exception loading SMTP config:', error);
      return null;
    }
  }
}
