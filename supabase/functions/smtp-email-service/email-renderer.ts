
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';

export interface EmailTheme {
  id: string;
  name: string;
  header_html?: string;
  footer_html?: string;
  styles_css?: string;
}

export interface EmailTemplate {
  id: string;
  template_name: string;
  subject: string;
  html_body_template?: string;
  text_body_template?: string;
  selected_theme_id?: string;
  variables?: any[];
}

export class EmailRenderer {
  static replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, value || '');
    }
    
    // Clean up any remaining unreplaced variables
    result = result.replace(/{{[^}]+}}/g, '');
    
    return result;
  }

  static async renderEmailWithTheme(
    template: EmailTemplate,
    theme: EmailTheme | null,
    variables: Record<string, string>
  ): Promise<{ html: string; text: string; subject: string }> {
    // Replace variables in subject
    const subject = this.replaceVariables(template.subject, variables);
    
    // Replace variables in content
    const htmlContent = template.html_body_template 
      ? this.replaceVariables(template.html_body_template, variables)
      : this.replaceVariables(template.text_body_template || '', variables);
    
    const textContent = template.text_body_template
      ? this.replaceVariables(template.text_body_template, variables)
      : this.stripHtml(htmlContent);

    // Apply theme if available
    let finalHtml = htmlContent;
    if (theme) {
      const styles = theme.styles_css || '';
      const header = theme.header_html || '';
      const footer = theme.footer_html || '';
      
      finalHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${styles}</style>
        </head>
        <body>
          <div class="container">
            ${header}
            <div class="content">
              ${htmlContent}
            </div>
            ${footer}
          </div>
        </body>
        </html>
      `;
    }

    return {
      html: finalHtml,
      text: textContent,
      subject
    };
  }

  private static stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }
}
