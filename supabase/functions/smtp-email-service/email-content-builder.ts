
import { TemplateManager, EmailTemplate, EmailTheme } from './template-manager.ts';
import { EmailRenderer } from './email-renderer.ts';

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export class EmailContentBuilder {
  constructor(
    private templateManager: TemplateManager
  ) {}

  async buildEmailContent(
    triggerType?: string,
    templateVariables: Record<string, string> = {},
    fallbackSubject?: string,
    fallbackMessage?: string
  ): Promise<EmailContent> {
    console.log('📧 Building email content for trigger:', triggerType);
    
    // Get template by trigger type
    let template: EmailTemplate | null = null;
    let theme: EmailTheme | null = null;
    
    if (triggerType) {
      template = await this.templateManager.getTemplateByTrigger(triggerType);
      
      if (template && template.selected_theme_id) {
        theme = await this.templateManager.getThemeById(template.selected_theme_id);
      }
      
      if (!theme) {
        theme = await this.templateManager.getDefaultTheme();
      }
    }

    // Prepare email content
    if (template) {
      console.log(`✅ Using template: ${template.template_name}`);
      
      try {
        const rendered = await EmailRenderer.renderEmailWithTheme(template, theme, templateVariables);
        
        // Validate the rendered content
        if (!rendered.subject?.trim()) {
          throw new Error('Template rendered empty subject');
        }
        if (!rendered.html?.trim() && !rendered.text?.trim()) {
          throw new Error('Template rendered empty content');
        }
        
        return {
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text
        };
      } catch (error) {
        console.error('❌ Template rendering failed:', error);
        // Fall through to fallback content
      }
    }
    
    console.log(`📝 Using fallback content for trigger: ${triggerType}`);
    const subject = fallbackSubject || `Notification from FleetIQ`;
    const text = fallbackMessage || `You have received a notification from FleetIQ.`;
    
    // Ensure fallback content is valid
    if (!subject.trim() || !text.trim()) {
      throw new Error('Invalid fallback content provided');
    }
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">${subject}</h2>
        <p>${text.replace(/\n/g, '<br>')}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280;">
          This is an automated message from FleetIQ.
        </p>
      </div>
    `;
    
    console.log('📧 Generated fallback email content:', {
      subject,
      textLength: text.length,
      htmlLength: html.length
    });
    
    return { subject, html, text };
  }
}
