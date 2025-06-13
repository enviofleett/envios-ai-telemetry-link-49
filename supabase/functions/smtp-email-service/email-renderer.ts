
import type { EmailTemplate, EmailTheme } from './template-manager.ts';

export class EmailRenderer {
  static async renderEmailWithTheme(
    template: EmailTemplate,
    theme: EmailTheme | null,
    variables: Record<string, string>
  ): Promise<{ subject: string; html: string; text: string }> {
    
    // Use correct database column names and provide fallbacks
    let subject = template.subject || 'Notification from FleetIQ';
    let htmlContent = template.html_body_template || template.body_html || '';
    let textContent = template.text_body_template || template.body_text || '';
    
    // Fallback: if no specific content templates, try general body_template for backward compatibility
    if (!htmlContent && !textContent && (template as any).body_template) {
      htmlContent = (template as any).body_template;
      textContent = (template as any).body_template;
    }
    
    console.log('📧 Template content before processing:', {
      subject: subject,
      hasHtml: !!htmlContent,
      hasText: !!textContent,
      htmlLength: htmlContent?.length || 0,
      textLength: textContent?.length || 0
    });

    // Replace template variables in all content
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      const regex = new RegExp(placeholder, 'g');
      subject = subject.replace(regex, value);
      htmlContent = htmlContent.replace(regex, value);
      textContent = textContent.replace(regex, value);
    });

    // Validation: Ensure we have at least some content
    if (!subject.trim()) {
      subject = 'Notification from FleetIQ';
    }
    
    if (!htmlContent.trim() && !textContent.trim()) {
      const defaultMessage = 'You have received a notification from FleetIQ.';
      htmlContent = defaultMessage;
      textContent = defaultMessage;
      console.log('⚠️ No template content found, using default message');
    }

    // Apply theme styling to HTML content
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

    // Generate HTML email with theme styling
    const html = `
      <div style="font-family: ${themeStyles.fontFamily}; max-width: 600px; margin: 0 auto; background-color: ${themeStyles.backgroundColor};">
        <div style="background-color: ${themeStyles.headerColor}; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; color: white;">${subject}</h1>
        </div>
        <div style="padding: 20px; color: ${themeStyles.textColor};">
          ${htmlContent.replace(/\n/g, '<br>')}
        </div>
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 12px; color: #6b7280;">
            This is an automated message from FleetIQ.
          </p>
        </div>
      </div>
    `;

    // Generate plain text version
    const text = textContent || htmlContent.replace(/<[^>]*>/g, ''); // Strip HTML tags if no text content

    // Final validation before returning
    const result = { subject, html, text };
    
    console.log('📧 Final email content:', {
      subject: result.subject,
      htmlLength: result.html.length,
      textLength: result.text.length,
      hasValidContent: !!(result.html.trim() || result.text.trim())
    });
    
    // Ensure we never return completely empty content
    if (!result.html.trim() && !result.text.trim()) {
      throw new Error('Email content is empty after processing template');
    }

    return result;
  }
}
