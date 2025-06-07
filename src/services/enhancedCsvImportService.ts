
import { supabase } from '@/integrations/supabase/client';
import { 
  EnhancedCSVRowData, 
  EnhancedImportPreviewData, 
  GP51SyncStatus,
  CSVImportRelationship,
  EnhancedCSVImportJob
} from '@/types/enhanced-csv-import';
import { CSVImportTemplate, ValidationError } from '@/types/csv-import';
import { gp51ValidationService } from './gp51ValidationService';

class EnhancedCSVImportService {
  async getEnhancedTemplates(): Promise<CSVImportTemplate[]> {
    const { data, error } = await supabase
      .from('csv_import_templates')
      .select('*')
      .eq('supports_user_import', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(template => ({
      ...template,
      column_mappings: template.column_mappings as Record<string, any>,
      validation_rules: template.validation_rules as Record<string, any>
    })) as CSVImportTemplate[];
  }

  async validateEnhancedCSV(csvContent: string): Promise<EnhancedImportPreviewData> {
    const rows = this.parseCSV(csvContent);
    const validRows: EnhancedCSVRowData[] = [];
    const invalidRows: EnhancedImportPreviewData['invalid_rows'] = [];
    const conflicts: EnhancedImportPreviewData['conflicts'] = [];
    
    // Get existing users and devices for conflict detection
    const { data: existingUsers } = await supabase
      .from('envio_users')
      .select('email, gp51_username');
    
    const { data: existingVehicles } = await supabase
      .from('vehicles')
      .select('device_id');
    
    const existingEmails = new Set(existingUsers?.map(u => u.email) || []);
    const existingUsernames = new Set(
      existingUsers?.map(u => u.gp51_username).filter(Boolean) || []
    );
    const existingDeviceIds = new Set(existingVehicles?.map(v => v.device_id) || []);

    // Track unique entries in this import
    const importUserEmails = new Set<string>();
    const importDeviceIds = new Set<string>();
    const generatedUsernames = new Set<string>();

    let gp51ValidationStats = {
      username_conflicts: 0,
      device_type_issues: 0,
      auto_generated_usernames: 0
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const errors: ValidationError[] = [];
      const rowNumber = i + 1;

      // Basic validation
      if (!row.user_name || row.user_name.trim() === '') {
        errors.push({
          row_number: rowNumber,
          field_name: 'user_name',
          error_message: 'User name is required'
        });
      }

      if (!row.user_email || row.user_email.trim() === '') {
        errors.push({
          row_number: rowNumber,
          field_name: 'user_email',
          error_message: 'User email is required'
        });
      }

      if (!row.device_id || row.device_id.trim() === '') {
        errors.push({
          row_number: rowNumber,
          field_name: 'device_id',
          error_message: 'Device ID is required'
        });
      }

      if (!row.device_name || row.device_name.trim() === '') {
        errors.push({
          row_number: rowNumber,
          field_name: 'device_name',
          error_message: 'Device name is required'
        });
      }

      // GP51 validation
      if (errors.length === 0) {
        const gp51Result = await gp51ValidationService.validateRow(
          row as EnhancedCSVRowData, 
          new Set([...existingUsernames, ...generatedUsernames])
        );

        // Update stats
        if (gp51Result.generatedUsername && !row.gp51_username) {
          gp51ValidationStats.auto_generated_usernames++;
          generatedUsernames.add(gp51Result.generatedUsername);
        }

        if (gp51Result.conflicts.length > 0) {
          gp51Result.conflicts.forEach(conflict => {
            if (conflict.type.includes('username')) {
              gp51ValidationStats.username_conflicts++;
            }
            if (conflict.type.includes('device_type')) {
              gp51ValidationStats.device_type_issues++;
            }
          });
        }

        // Check for duplicates within this import
        if (importUserEmails.has(row.user_email)) {
          conflicts.push({
            row_number: rowNumber,
            conflict_type: 'duplicate_user',
            suggested_resolution: 'Remove duplicate or merge user data'
          });
        }

        if (importDeviceIds.has(row.device_id)) {
          conflicts.push({
            row_number: rowNumber,
            conflict_type: 'duplicate_device',
            suggested_resolution: 'Remove duplicate device'
          });
        }

        // Check against existing data
        if (existingEmails.has(row.user_email)) {
          conflicts.push({
            row_number: rowNumber,
            conflict_type: 'duplicate_user',
            suggested_resolution: 'User already exists - will update assignment'
          });
        }

        if (existingDeviceIds.has(row.device_id)) {
          conflicts.push({
            row_number: rowNumber,
            conflict_type: 'duplicate_device',
            suggested_resolution: 'Device already exists - will reassign'
          });
        }

        if (gp51Result.isValid) {
          const enhancedRow: EnhancedCSVRowData = {
            ...row,
            generated_username: gp51Result.generatedUsername,
            validation_flags: gp51Result.validationFlags,
            device_type: gp51Result.deviceTypeMapping || row.device_type,
            assignment_type: (row.assignment_type as any) || 'assigned'
          };
          
          validRows.push(enhancedRow);
          importUserEmails.add(row.user_email);
          importDeviceIds.add(row.device_id);
        } else {
          gp51Result.conflicts.forEach(conflict => {
            errors.push({
              row_number: rowNumber,
              field_name: conflict.type,
              error_message: conflict.message
            });
          });
        }
      }

      if (errors.length > 0) {
        invalidRows.push({
          row_number: rowNumber,
          data: row,
          errors
        });
      }
    }

    const uniqueUsers = new Set(validRows.map(r => r.user_email)).size;
    const uniqueDevices = new Set(validRows.map(r => r.device_id)).size;

    return {
      valid_rows: validRows,
      invalid_rows: invalidRows,
      conflicts,
      gp51_validation: gp51ValidationStats,
      summary: {
        total_rows: rows.length,
        valid_rows: validRows.length,
        invalid_rows: invalidRows.length,
        conflicts: conflicts.length,
        unique_users: uniqueUsers,
        unique_devices: uniqueDevices
      }
    };
  }

  async createEnhancedImportJob(jobData: {
    job_name: string;
    file_name: string;
    total_rows: number;
    supports_user_import: boolean;
    gp51_sync_enabled: boolean;
  }): Promise<EnhancedCSVImportJob> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('csv_import_jobs')
      .insert({
        job_name: jobData.job_name,
        file_name: jobData.file_name,
        total_rows: jobData.total_rows,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      ...data,
      status: data.status as 'pending' | 'processing' | 'completed' | 'failed',
      error_log: (data.error_log as any) || [],
      import_results: (data.import_results as any) || {},
      supports_user_import: jobData.supports_user_import,
      gp51_sync_enabled: jobData.gp51_sync_enabled
    } as EnhancedCSVImportJob;
  }

  async trackSyncStatus(importJobId: string, entityType: 'user' | 'vehicle', entityId: string, gp51Id?: string): Promise<void> {
    const { error } = await supabase
      .from('gp51_sync_status')
      .insert({
        import_job_id: importJobId,
        entity_type: entityType,
        entity_id: entityId,
        gp51_id: gp51Id,
        sync_status: gp51Id ? 'synced' : 'pending'
      });

    if (error) throw error;
  }

  async createImportRelationship(data: {
    import_job_id: string;
    user_identifier: string;
    device_id: string;
    relationship_type: 'assigned' | 'owner' | 'operator';
    row_number: number;
    gp51_user_id?: string;
    gp51_device_id?: string;
  }): Promise<void> {
    const { error } = await supabase
      .from('csv_import_relationships')
      .insert(data);

    if (error) throw error;
  }

  async getSyncStatus(importJobId: string): Promise<GP51SyncStatus[]> {
    const { data, error } = await supabase
      .from('gp51_sync_status')
      .select('*')
      .eq('import_job_id', importJobId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getImportRelationships(importJobId: string): Promise<CSVImportRelationship[]> {
    const { data, error } = await supabase
      .from('csv_import_relationships')
      .select('*')
      .eq('import_job_id', importJobId)
      .order('row_number', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  private parseCSV(csvContent: string): Record<string, any>[] {
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

  generateEnhancedCSVTemplate(): string {
    return gp51ValidationService.generateCSVTemplate();
  }
}

export const enhancedCSVImportService = new EnhancedCSVImportService();
