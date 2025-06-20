
import { supabase } from '@/integrations/supabase/client';

export interface WorkshopAuthResult {
  success: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    workshop_id: string;
  };
  session?: {
    expires_at: string;
  };
  error?: string;
}

export class WorkshopAuthService {
  static async authenticateWorkshopUser(
    email: string,
    password: string,
    workshopId: string
  ): Promise<WorkshopAuthResult> {
    try {
      const { data, error } = await supabase.functions.invoke('workshop-auth', {
        body: {
          action: 'login',
          email,
          password,
          workshop_id: workshopId
        }
      });

      if (error) {
        console.error('Workshop authentication error:', error);
        return {
          success: false,
          error: error.message || 'Authentication failed'
        };
      }

      if (data.error) {
        return {
          success: false,
          error: data.error
        };
      }

      return {
        success: true,
        user: data.user,
        session: data.session
      };
    } catch (error) {
      console.error('Workshop auth service error:', error);
      return {
        success: false,
        error: 'Authentication service unavailable'
      };
    }
  }
}
