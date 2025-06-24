
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

export interface CSVImportJob {
  id: string;
  job_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_name: string;
  total_rows: number;
  processed_rows: number;
  successful_imports: number;
  failed_imports: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  error_log: ValidationError[];
  import_results: Record<string, any>;
  progress_percentage: number;
}

export interface ImportPreviewData {
  valid_rows: any[];
  invalid_rows: Array<{
    row_number: number;
    data: Record<string, any>;
    errors: ValidationError[];
  }>;
  conflicts: Array<{
    row_number: number;
    device_id: string;
    conflict_type: 'duplicate_device_id' | 'user_not_found';
    existing_data?: any;
  }>;
  summary: {
    total_rows: number;
    valid_rows: number;
    invalid_rows: number;
    conflicts: number;
  };
}

class MockCSVImportService {
  // Method names that useCSVImport expects
  async getImportJobs(): Promise<CSVImportJob[]> {
    return [];
  }

  async getImportTemplates(): Promise<CSVImportTemplate[]> {
    // Alias for getTemplates
    return this.getTemplates();
  }

  async getTemplates(): Promise<CSVImportTemplate[]> {
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
    return {
      ...template,
      id: `template-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  async parseCSV(csvContent: string): Promise<any[]> {
    // Parse CSV content into rows
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim());
      const row: any = { _rowNumber: index + 2 }; // +2 because we skip header and are 1-indexed
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      return row;
    });
  }

  async validateCSV(csvContent: string, templateId: string): Promise<{
    isValid: boolean;
    errors: ValidationError[];
    preview: any[];
  }> {
    return {
      isValid: true,
      errors: [],
      preview: [
        { 'Device ID': 'DEV001', 'Vehicle Name': 'Vehicle 1', 'License Plate': 'ABC123' },
        { 'Device ID': 'DEV002', 'Vehicle Name': 'Vehicle 2', 'License Plate': 'XYZ789' }
      ]
    };
  }

  async validateCSVData(rows: any[], template: CSVImportTemplate): Promise<ImportPreviewData> {
    // Alias for validateCSV with different signature
    return {
      valid_rows: rows.slice(0, Math.floor(rows.length * 0.8)),
      invalid_rows: rows.slice(Math.floor(rows.length * 0.8)).map((row, index) => ({
        row_number: index + Math.floor(rows.length * 0.8) + 1,
        data: row,
        errors: [{ row: index, field: 'example', message: 'Mock validation error', value: row }]
      })),
      conflicts: [],
      summary: {
        total_rows: rows.length,
        valid_rows: Math.floor(rows.length * 0.8),
        invalid_rows: rows.length - Math.floor(rows.length * 0.8),
        conflicts: 0
      }
    };
  }

  async createImportJob(jobData: {
    job_name: string;
    file_name: string;
    total_rows: number;
  }): Promise<CSVImportJob> {
    return {
      id: `job-${Date.now()}`,
      job_name: jobData.job_name,
      status: 'pending',
      file_name: jobData.file_name,
      total_rows: jobData.total_rows,
      processed_rows: 0,
      successful_imports: 0,
      failed_imports: 0,
      created_by: 'mock-user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      error_log: [],
      import_results: {},
      progress_percentage: 0
    };
  }

  generateTemplate(type: 'vehicles' | 'users'): string {
    if (type === 'vehicles') {
      return 'Device ID,Vehicle Name,License Plate,User Email\nDEV001,Vehicle 1,ABC123,user@example.com';
    } else {
      return 'Full Name,Email Address,Phone,City\nJohn Doe,john@example.com,+1234567890,New York';
    }
  }

  generateCSVTemplate(): string {
    // Alias for generateTemplate with default type
    return this.generateTemplate('vehicles');
  }
}

export const csvImportService = new MockCSVImportService();
