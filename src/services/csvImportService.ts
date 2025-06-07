
import { supabase } from '@/integrations/supabase/client';
import { CSVImportJob, CSVImportTemplate, ImportPreviewData, CSVRowData, ValidationError } from '@/types/csv-import';

class CSVImportService {
  async getImportTemplates(): Promise<CSVImportTemplate[]> {
    const { data, error } = await supabase
      .from('csv_import_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Type cast the Supabase data to our types
    return (data || []).map(template => ({
      ...template,
      column_mappings: template.column_mappings as Record<string, any>,
      validation_rules: template.validation_rules as Record<string, any>
    })) as CSVImportTemplate[];
  }

  async createImportJob(jobData: {
    job_name: string;
    file_name: string;
    total_rows: number;
  }): Promise<CSVImportJob> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('csv_import_jobs')
      .insert({
        ...jobData,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    
    // Type cast the result
    return {
      ...data,
      status: data.status as 'pending' | 'processing' | 'completed' | 'failed',
      error_log: (data.error_log as any) || [],
      import_results: (data.import_results as any) || {}
    } as CSVImportJob;
  }

  async getImportJobs(): Promise<CSVImportJob[]> {
    const { data, error } = await supabase
      .from('csv_import_jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Type cast the results
    return (data || []).map(job => ({
      ...job,
      status: job.status as 'pending' | 'processing' | 'completed' | 'failed',
      error_log: (job.error_log as any) || [],
      import_results: (job.import_results as any) || {}
    })) as CSVImportJob[];
  }

  async updateImportJobProgress(jobId: string, updates: Partial<CSVImportJob>): Promise<void> {
    // Convert our types to Supabase-compatible types
    const supabaseUpdates: any = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    // Convert error_log to JSON if present
    if (updates.error_log) {
      supabaseUpdates.error_log = updates.error_log;
    }

    const { error } = await supabase
      .from('csv_import_jobs')
      .update(supabaseUpdates)
      .eq('id', jobId);

    if (error) throw error;
  }

  parseCSV(csvContent: string): Record<string, any>[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV must have at least a header and one data row');

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows: Record<string, any>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length !== headers.length) {
        throw new Error(`Row ${i + 1} has ${values.length} columns, expected ${headers.length}`);
      }

      const row: Record<string, any> = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      rows.push(row);
    }

    return rows;
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  async validateCSVData(rows: Record<string, any>[], template: CSVImportTemplate): Promise<ImportPreviewData> {
    const validRows: CSVRowData[] = [];
    const invalidRows: ImportPreviewData['invalid_rows'] = [];
    const conflicts: ImportPreviewData['conflicts'] = [];

    // Get existing device IDs for conflict detection
    const { data: existingVehicles } = await supabase
      .from('vehicles')
      .select('device_id');
    
    const existingDeviceIds = new Set(existingVehicles?.map(v => v.device_id) || []);

    // Get existing users for email validation
    const { data: existingUsers } = await supabase
      .from('envio_users')
      .select('email');
    
    const existingEmails = new Set(existingUsers?.map(u => u.email) || []);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const errors: ValidationError[] = [];
      const rowNumber = i + 1;

      // Validate required fields
      Object.entries(template.column_mappings).forEach(([field, mapping]) => {
        if (mapping.required && (!row[field] || row[field].toString().trim() === '')) {
          errors.push({
            row_number: rowNumber,
            field_name: field,
            error_message: `${field} is required`
          });
        }
      });

      // Validate data types
      if (row.device_id && typeof row.device_id !== 'string') {
        errors.push({
          row_number: rowNumber,
          field_name: 'device_id',
          error_message: 'device_id must be a string'
        });
      }

      // Validate email format
      if (row.assigned_user_email && row.assigned_user_email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.assigned_user_email)) {
          errors.push({
            row_number: rowNumber,
            field_name: 'assigned_user_email',
            error_message: 'Invalid email format'
          });
        } else if (!existingEmails.has(row.assigned_user_email)) {
          conflicts.push({
            row_number: rowNumber,
            device_id: row.device_id,
            conflict_type: 'user_not_found'
          });
        }
      }

      // Check for duplicate device IDs
      if (row.device_id && existingDeviceIds.has(row.device_id)) {
        conflicts.push({
          row_number: rowNumber,
          device_id: row.device_id,
          conflict_type: 'duplicate_device_id'
        });
      }

      if (errors.length > 0) {
        invalidRows.push({
          row_number: rowNumber,
          data: row,
          errors
        });
      } else {
        validRows.push({
          device_id: row.device_id,
          device_name: row.device_name,
          device_type: row.device_type || '',
          sim_number: row.sim_number || '',
          status: row.status || 'active',
          notes: row.notes || '',
          assigned_user_email: row.assigned_user_email || '',
          is_active: row.is_active !== undefined ? row.is_active === 'true' || row.is_active === true : true
        });
      }
    }

    return {
      valid_rows: validRows,
      invalid_rows: invalidRows,
      conflicts,
      summary: {
        total_rows: rows.length,
        valid_rows: validRows.length,
        invalid_rows: invalidRows.length,
        conflicts: conflicts.length
      }
    };
  }

  generateCSVTemplate(): string {
    const headers = [
      'device_id',
      'device_name', 
      'device_type',
      'sim_number',
      'status',
      'notes',
      'assigned_user_email',
      'is_active'
    ];

    const sampleData = [
      'DEV001,Sample Vehicle 1,GPS Tracker,1234567890,active,Sample notes,user@example.com,true',
      'DEV002,Sample Vehicle 2,GPS Tracker,0987654321,active,Another sample,user2@example.com,true'
    ];

    return [headers.join(','), ...sampleData].join('\n');
  }
}

export const csvImportService = new CSVImportService();
