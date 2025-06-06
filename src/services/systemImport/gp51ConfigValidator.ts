
import { supabase } from '@/integrations/supabase/client';

export class GP51ConfigValidator {
  async validateConfiguration(): Promise<boolean> {
    try {
      console.log('Validating GP51 configuration...');
      
      // Test GP51 connectivity
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_connection' }
      });
      
      if (error) {
        console.error('GP51 configuration test failed:', error);
        return false;
      }
      
      const isValid = data?.success || false;
      console.log('GP51 configuration validation result:', isValid);
      return isValid;
    } catch (error) {
      console.error('Failed to validate GP51 configuration:', error);
      return false;
    }
  }
}

export const gp51ConfigValidator = new GP51ConfigValidator();
