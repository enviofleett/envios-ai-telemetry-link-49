
import { vehiclePositionSyncService } from './vehiclePositionSyncService';
import { gp51SessionValidator } from './sessionValidator';
import { PollingResetService } from './pollingResetService';
import { enhancedGP51SessionValidator } from './enhancedSessionValidator';

export class SystemResetService {
  static async performFullReset(): Promise<{ success: boolean; error?: string }> {
    console.log('🔄 Starting full system reset for live data fetching...');
    
    try {
      // Step 1: Reset polling status and clear errors
      console.log('Step 1: Resetting polling status...');
      await PollingResetService.forcePollingRestart();
      
      // Step 2: Clear all session caches
      console.log('Step 2: Clearing session caches...');
      gp51SessionValidator.clearCache();
      enhancedGP51SessionValidator.clearCache();
      
      // Step 3: Force session revalidation
      console.log('Step 3: Force revalidating sessions...');
      enhancedGP51SessionValidator.forceRevalidation();
      
      // Step 4: Reset and restart vehicle position sync
      console.log('Step 4: Resetting vehicle position sync...');
      await vehiclePositionSyncService.resetAndRestart();
      
      console.log('✅ Full system reset completed successfully');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Full system reset failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error during reset' 
      };
    }
  }

  static async quickRestart(): Promise<{ success: boolean; error?: string }> {
    console.log('⚡ Starting quick restart for live data fetching...');
    
    try {
      // Clear caches
      gp51SessionValidator.clearCache();
      enhancedGP51SessionValidator.clearCache();
      
      // Force immediate sync
      const result = await vehiclePositionSyncService.forceSync();
      
      console.log('⚡ Quick restart completed:', result.message);
      return { success: result.success, error: result.success ? undefined : result.message };
      
    } catch (error) {
      console.error('❌ Quick restart failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error during restart' 
      };
    }
  }
}
