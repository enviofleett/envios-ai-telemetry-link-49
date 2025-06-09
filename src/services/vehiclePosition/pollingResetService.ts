
import { supabase } from '@/integrations/supabase/client';

export class PollingResetService {
  static async resetPollingStatus(): Promise<void> {
    console.log('🔄 Resetting GP51 polling status...');
    
    try {
      // Reset the polling configuration error count and status
      const { error: resetError } = await supabase.rpc('update_polling_status', {
        p_last_poll_time: new Date().toISOString(),
        p_success: true,
        p_error_message: null
      });

      if (resetError) {
        console.error('Failed to reset polling status:', resetError);
        throw resetError;
      }

      // Also update the polling config directly to ensure clean state
      const { error: configError } = await supabase
        .from('gp51_polling_config')
        .update({
          error_count: 0,
          last_error: null,
          updated_at: new Date().toISOString()
        });

      if (configError) {
        console.error('Failed to reset polling config:', configError);
        throw configError;
      }

      console.log('✅ Polling status reset successfully');
    } catch (error) {
      console.error('❌ Failed to reset polling status:', error);
      throw error;
    }
  }

  static async forcePollingRestart(): Promise<void> {
    console.log('🔄 Force restarting polling service...');
    
    try {
      // Reset polling status first
      await this.resetPollingStatus();
      
      // Clear any cached session data
      const { SessionCacheManager } = await import('./sessionCacheManager');
      SessionCacheManager.clearCache();
      
      console.log('✅ Polling service restart initiated');
    } catch (error) {
      console.error('❌ Failed to restart polling service:', error);
      throw error;
    }
  }
}
