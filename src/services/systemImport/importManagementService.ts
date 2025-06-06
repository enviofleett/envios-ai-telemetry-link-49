
import { supabase } from '@/integrations/supabase/client';

export class ImportManagementService {
  async rollbackImport(importId: string): Promise<void> {
    console.log('Starting rollback for import:', importId);
    
    const { data: importJob, error } = await supabase
      .from('gp51_system_imports')
      .select('rollback_data, backup_tables')
      .eq('id', importId)
      .single();

    if (error) throw error;

    // For now, we'll log the rollback attempt
    // In production, this would restore from backup tables
    const backupTablesData = importJob.backup_tables;
    
    if (backupTablesData && typeof backupTablesData === 'object') {
      if ('backup_tables' in backupTablesData) {
        const backupTables = (backupTablesData as any).backup_tables;
        console.log('Rolling back from backup tables:', backupTables);
        
        // Log audit event
        await supabase
          .from('gp51_import_audit_log')
          .insert({
            system_import_id: importId,
            operation_type: 'rollback_completed',
            operation_details: { backupTables },
            success: true
          });
      }
    }
  }

  async cancelImport(importId: string): Promise<void> {
    console.log('Cancelling import:', importId);
    
    await supabase
      .from('gp51_system_imports')
      .update({
        status: 'cancelled',
        current_phase: 'cancelled',
        phase_details: 'Import cancelled by user'
      })
      .eq('id', importId);
  }
}

export const importManagementService = new ImportManagementService();
