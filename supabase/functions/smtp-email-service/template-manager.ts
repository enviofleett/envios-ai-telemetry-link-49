
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import type { EmailTemplate, EmailTheme } from './email-renderer.ts';

export class TemplateManager {
  private supabase;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async getTemplateByTrigger(triggerType: string): Promise<EmailTemplate | null> {
    console.log(`🔍 Looking for template with trigger_type: ${triggerType}`);
    
    const { data: template, error } = await this.supabase
      .from('email_templates')
      .select('*')
      .eq('trigger_type', triggerType)
      .eq('is_active', true)
      .single();

    if (error) {
      console.log(`❌ Template lookup error:`, error);
      return null;
    }

    console.log(`✅ Found template: ${template?.template_name}`);
    return template;
  }

  async getThemeById(themeId: string): Promise<EmailTheme | null> {
    if (!themeId) return null;

    const { data: theme, error } = await this.supabase
      .from('email_themes')
      .select('*')
      .eq('id', themeId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.log(`❌ Theme lookup error:`, error);
      return null;
    }

    return theme;
  }

  async getDefaultTheme(): Promise<EmailTheme | null> {
    const { data: theme, error } = await this.supabase
      .from('email_themes')
      .select('*')
      .eq('name', 'Default Envio')
      .eq('is_active', true)
      .single();

    if (error) {
      console.log(`❌ Default theme lookup error:`, error);
      return null;
    }

    return theme;
  }
}
