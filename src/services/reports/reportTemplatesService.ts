
// Placeholder service for report templates - table not available in current schema
export interface ReportTemplate {
  id: string;
  name: string;
  report_type: string;
  created_by: string;
  template_config: any;
  created_at: string;
  updated_at: string;
}

class ReportTemplatesService {
  async getTemplates(): Promise<ReportTemplate[]> {
    console.log('Report templates service not available - table missing from schema');
    return [];
  }

  async getTemplateById(id: string): Promise<ReportTemplate | null> {
    console.log('Report templates service not available - table missing from schema');
    return null;
  }

  async createTemplate(template: Omit<ReportTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<ReportTemplate | null> {
    console.log('Report templates service not available - table missing from schema');
    return null;
  }

  async updateTemplate(id: string, updates: Partial<ReportTemplate>): Promise<ReportTemplate | null> {
    console.log('Report templates service not available - table missing from schema');
    return null;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    console.log('Report templates service not available - table missing from schema');
    return false;
  }
}

export const reportTemplatesService = new ReportTemplatesService();
