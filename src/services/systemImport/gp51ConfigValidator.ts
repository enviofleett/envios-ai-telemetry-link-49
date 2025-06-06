
import { supabase } from '@/integrations/supabase/client';

export class GP51ConfigValidator {
  async validateConfiguration(): Promise<boolean> {
    try {
      // Check if GP51 base URL is configured
      const gp51BaseUrl = import.meta.env.GP51_API_BASE_URL || 'https://www.gps51.com';
      if (!gp51BaseUrl) {
        console.error('GP51_API_BASE_URL not configured');
        return false;
      }

      // Check if we have any GP51 sessions
      const { data: sessions, error } = await supabase
        .from('gp51_sessions')
        .select('id')
        .limit(1);

      if (error) {
        console.error('Failed to check GP51 sessions:', error);
        return false;
      }

      if (!sessions || sessions.length === 0) {
        console.error('No GP51 sessions found');
        return false;
      }

      return true;
    } catch (error) {
      console.error('GP51 configuration validation failed:', error);
      return false;
    }
  }
}

export const gp51ConfigValidator = new GP51ConfigValidator();
