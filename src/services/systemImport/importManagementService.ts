
import { supabase } from '@/integrations/supabase/client';

export class ImportManagementService {
  async rollbackImport(importId: string): Promise<void> {
    console.log('Rolling back import:', importId);
    
    try {
      // Update import status to rolled back
      await supabase
        .from('gp51_system_imports')
        .update({
          status: 'rolled_back',
          updated_at: new Date().toISOString()
        })
        .eq('id', importId);

      console.log('Import rollback completed');
    } catch (error) {
      console.error('Import rollback failed:', error);
      throw error;
    }
  }

  async cancelImport(importId: string): Promise<void> {
    console.log('Cancelling import:', importId);
    
    try {
      // Update import status to cancelled
      await supabase
        .from('gp51_system_imports')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', importId);

      console.log('Import cancellation completed');
    } catch (error) {
      console.error('Import cancellation failed:', error);
      throw error;
    }
  }
}

export const importManagementService = new ImportManagementService();
