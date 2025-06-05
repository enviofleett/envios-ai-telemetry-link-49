
import { supabase } from '@/integrations/supabase/client';

export class SyncStatusUpdater {
  async updateSyncStatus(success: boolean, errorMessage?: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_polling_status', {
        p_last_poll_time: new Date().toISOString(),
        p_success: success,
        p_error_message: errorMessage || null
      });

      if (error) {
        console.error('Failed to update sync status:', error);
      }
    } catch (error) {
      console.error('Error updating sync status:', error);
    }
  }
}

export const syncStatusUpdater = new SyncStatusUpdater();
