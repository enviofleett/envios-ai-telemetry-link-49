
// Mock CSV Import Service - Database table not yet implemented
export interface CSVImportTemplate {
  id: string;
  template_name: string;
  template_type: string;
  column_mappings: Record<string, any>;
  validation_rules: {
    required_fields: string[];
    field_types: Record<string, string>;
    custom_validations: any[];
  };
  is_system_template: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value: any;
}

class MockCSVImportService {
  async getTemplates(): Promise<CSVImportTemplate[]> {
    // Return mock templates since database table doesn't exist
    return [
      {
        id: 'template-1',
        template_name: 'Vehicle Import',
        template_type: 'vehicles',
        column_mappings: {
          'device_id': 'Device ID',
          'name': 'Vehicle Name',
          'license_plate': 'License Plate'
        },
        validation_rules: {
          required_fields: ['device_id', 'name'],
          field_types: {
            'device_id': 'string',
            'name': 'string'
          },
          custom_validations: []
        },
        is_system_template: true,
        created_by: 'system',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'template-2',
        template_name: 'User Import',
        template_type: 'users',
        column_mappings: {
          'name': 'Full Name',
          'email': 'Email Address',
          'phone_number': 'Phone'
        },
        validation_rules: {
          required_fields: ['name', 'email'],
          field_types: {
            'name': 'string',
            'email': 'email'
          },
          custom_validations: []
        },
        is_system_template: true,
        created_by: 'system',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  async getTemplateById(id: string): Promise<CSVImportTemplate | null> {
    const templates = await this.getTemplates();
    return templates.find(t => t.id === id) || null;
  }

  async createTemplate(template: Omit<CSVImportTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<CSVImportTemplate> {
    // Mock creation
    return {
      ...template,
      id: `template-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  async validateCSV(csvContent: string, templateId: string): Promise<{
    isValid: boolean;
    errors: ValidationError[];
    preview: any[];
  }> {
    // Mock validation
    return {
      isValid: true,
      errors: [],
      preview: [
        { 'Device ID': 'DEV001', 'Vehicle Name': 'Vehicle 1', 'License Plate': 'ABC123' },
        { 'Device ID': 'DEV002', 'Vehicle Name': 'Vehicle 2', 'License Plate': 'XYZ789' }
      ]
    };
  }

  generateTemplate(type: 'vehicles' | 'users'): string {
    if (type === 'vehicles') {
      return 'Device ID,Vehicle Name,License Plate,User Email\nDEV001,Vehicle 1,ABC123,user@example.com';
    } else {
      return 'Full Name,Email Address,Phone,City\nJohn Doe,john@example.com,+1234567890,New York';
    }
  }
}

export const csvImportService = new MockCSVImportService();
