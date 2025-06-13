
import type { EmailTemplate, EmailTheme } from './template-manager.ts';

export class EmailRenderer {
  static async renderEmailWithTheme(
    template: EmailTemplate,
    theme: EmailTheme | null,
    variables: Record<string, string>
  ): Promise<{ subject: string; html: string; text: string }> {
    
    // Replace variables in subject and body
    let subject = template.subject_template || 'Notification from FleetIQ';
    let bodyContent = template.body_template || 'You have received a notification.';

    // Replace template variables
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), value);
      bodyContent = bodyContent.replace(new RegExp(placeholder, 'g'), value);
    });

    // Apply theme styling
    const themeStyles = theme ? {
      headerColor: theme.header_color || '#1f2937',
      backgroundColor: theme.background_color || '#ffffff',
      textColor: theme.text_color || '#374151',
      fontFamily: theme.font_family || 'Arial, sans-serif'
    } : {
      headerColor: '#1f2937',
      backgroundColor: '#ffffff',
      textColor: '#374151',
      fontFamily: 'Arial, sans-serif'
    };

    const html = `
      <div style="font-family: ${themeStyles.fontFamily}; max-width: 600px; margin: 0 auto; background-color: ${themeStyles.backgroundColor};">
        <div style="background-color: ${themeStyles.headerColor}; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; color: white;">${subject}</h1>
        </div>
        <div style="padding: 20px; color: ${themeStyles.textColor};">
          ${bodyContent.replace(/\n/g, '<br>')}
        </div>
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 12px; color: #6b7280;">
            This is an automated message from FleetIQ.
          </p>
        </div>
      </div>
    `;

    const text = bodyContent.replace(/<[^>]*>/g, ''); // Strip HTML tags for text version

    return { subject, html, text };
  }
}
