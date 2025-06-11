
import { supabase } from '@/integrations/supabase/client';

export class GP51SessionManager {
  static async clearAllSessions(): Promise<void> {
    console.log('🧹 Clearing all GP51 sessions...');
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        return;
      }

      // Delete all GP51 sessions for this user
      const { error } = await supabase
        .from('gp51_sessions')
        .delete()
        .eq('envio_user_id', user.id);

      if (error) {
        console.error('❌ Failed to clear sessions:', error);
        throw error;
      }

      console.log('✅ All GP51 sessions cleared successfully');
    } catch (error) {
      console.error('❌ Session clearing failed:', error);
      throw error;
    }
  }

  static async getActiveSession(): Promise<any | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: sessions, error } = await supabase
        .from('gp51_sessions')
        .select('*')
        .eq('envio_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('❌ Failed to get active session:', error);
        return null;
      }

      return sessions && sessions.length > 0 ? sessions[0] : null;
    } catch (error) {
      console.error('❌ Error getting active session:', error);
      return null;
    }
  }

  static async validateSession(): Promise<{ valid: boolean; session?: any; error?: string }> {
    try {
      const session = await this.getActiveSession();
      
      if (!session) {
        return { valid: false, error: 'No GP51 session found' };
      }

      // Check if session is expired
      const expiresAt = new Date(session.token_expires_at);
      const now = new Date();
      
      if (expiresAt <= now) {
        await this.clearAllSessions();
        return { valid: false, error: 'Session expired' };
      }

      return { valid: true, session };
    } catch (error) {
      console.error('❌ Session validation failed:', error);
      return { valid: false, error: error instanceof Error ? error.message : 'Validation failed' };
    }
  }
}
