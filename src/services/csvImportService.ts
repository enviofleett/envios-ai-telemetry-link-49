
import { CSVImportTemplate, ValidationError, CSVImportJob, ImportPreviewData } from '@/types/csv-import';

class MockCSVImportService {
  async getImportJobs(): Promise<CSVImportJob[]> {
    return [];
  }

  async getImportTemplates(): Promise<CSVImportTemplate[]> {
    return this.getTemplates();
  }

  async getTemplates(): Promise<CSVImportTemplate[]> {
    return [
      {
        id: 'template-1',
        template_name: 'Vehicle Import',
        template_type: 'vehicles',
        column_mappings: {
          'device_id': {
            required: true,
            type: 'string',
            unique: true
          },
          'name': {
            required: true,
            type: 'string'
          },
          'license_plate': {
            required: false,
            type: 'string'
          }
        },
        validation_rules: {
          required_fields: ['device_id', 'name'],
          field_types: {
            'device_id': 'string',
            'name': 'string'
          },
          custom_validations: [],
          max_rows: 1000,
          allowed_formats: ['csv', 'xlsx'],
          required_columns: ['device_id', 'name']
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
          'name': {
            required: true,
            type: 'string'
          },
          'email': {
            required: true,
            type: 'email',
            unique: true
          },
          'phone_number': {
            required: false,
            type: 'string'
          }
        },
        validation_rules: {
          required_fields: ['name', 'email'],
          field_types: {
            'name': 'string',
            'email': 'email'
          },
          custom_validations: [],
          max_rows: 1000,
          allowed_formats: ['csv', 'xlsx'],
          required_columns: ['name', 'email']
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
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim());
      const row: any = { _rowNumber: index + 2 };
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
    const validRows = rows.slice(0, Math.floor(rows.length * 0.8));
    const invalidRows = rows.slice(Math.floor(rows.length * 0.8)).map((row, index) => ({
      row_number: index + Math.floor(rows.length * 0.8) + 1,
      data: row,
      errors: [{
        row_number: index + Math.floor(rows.length * 0.8) + 1,
        field_name: 'example',
        error_message: 'Mock validation error',
        raw_data: row
      }] as ValidationError[]
    }));

    return {
      valid_rows: validRows,
      invalid_rows: invalidRows,
      conflicts: [],
      summary: {
        total_rows: rows.length,
        valid_rows: validRows.length,
        invalid_rows: invalidRows.length,
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
    return this.generateTemplate('vehicles');
  }
}

export const csvImportService = new MockCSVImportService();
