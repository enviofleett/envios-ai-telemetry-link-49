
import { supabase } from '@/integrations/supabase/client';
import { enhancedGP51SessionManager } from '@/services/security/enhancedGP51SessionManager';

export interface GP51ConnectionConfig {
  username: string;
  password: string;
  apiUrl?: string;
}

export interface GP51Session {
  username: string;
  token: string;
  expiresAt: Date;
  lastValidated: Date;
  isValid: boolean;
}

export interface GP51ServiceResult {
  success: boolean;
  error?: string;
  data?: any;
}

export class ConsolidatedGP51Service {
  private static instance: ConsolidatedGP51Service;
  private sessionSubscribers: ((session: GP51Session | null) => void)[] = [];

  private constructor() {}

  static getInstance(): ConsolidatedGP51Service {
    if (!ConsolidatedGP51Service.instance) {
      ConsolidatedGP51Service.instance = new ConsolidatedGP51Service();
    }
    return ConsolidatedGP51Service.instance;
  }

  async authenticate(config: GP51ConnectionConfig): Promise<GP51ServiceResult> {
    try {
      console.log('🔐 Starting consolidated GP51 authentication...');

      // Call the secure authentication edge function
      const { data, error } = await supabase.functions.invoke('gp51-secure-auth', {
        body: {
          action: 'authenticate',
          username: config.username,
          password: config.password,
          apiUrl: config.apiUrl || 'https://www.gps51.com'
        }
      });

      if (error) {
        console.error('❌ Authentication edge function error:', error);
        return {
          success: false,
          error: error.message || 'Authentication service error'
        };
      }

      if (!data.success) {
        console.error('❌ Authentication failed:', data.error);
        return {
          success: false,
          error: data.error || 'Authentication failed'
        };
      }

      // Create secure session
      const sessionResult = await enhancedGP51SessionManager.createSecureSession(
        config.username,
        data.token
      );

      if (!sessionResult.success) {
        return {
          success: false,
          error: sessionResult.error || 'Failed to create secure session'
        };
      }

      // Convert to GP51Session format and notify subscribers
      const session: GP51Session = {
        username: config.username,
        token: data.token,
        expiresAt: sessionResult.session!.expiresAt,
        lastValidated: new Date(),
        isValid: true
      };

      this.notifySessionSubscribers(session);

      console.log('✅ Consolidated authentication completed successfully');
      return {
        success: true,
        data: session
      };

    } catch (error) {
      console.error('❌ Consolidated authentication error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication error'
      };
    }
  }

  async testConnection(): Promise<GP51ServiceResult> {
    try {
      const secureSession = enhancedGP51SessionManager.getCurrentSession();
      
      if (!secureSession) {
        return {
          success: false,
          error: 'No active session'
        };
      }

      const validation = await enhancedGP51SessionManager.validateCurrentSession();
      
      if (!validation.isValid) {
        return {
          success: false,
          error: `Session invalid: ${validation.reasons.join(', ')}`
        };
      }

      // Test the connection by making a simple API call
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: {
          action: 'test_connection',
          token: secureSession.token
        }
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'Connection test failed'
        };
      }

      return {
        success: data.success || false,
        error: data.error
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test error'
      };
    }
  }

  async refreshSession(): Promise<GP51ServiceResult> {
    try {
      console.log('🔄 Refreshing GP51 session...');

      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'refresh_session' }
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'Session refresh failed'
        };
      }

      if (!data.success || !data.token) {
        return {
          success: false,
          error: data.error || 'Session refresh failed'
        };
      }

      // Update session in database - remove is_active property
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: updateError } = await supabase
          .from('gp51_sessions')
          .update({
            gp51_token: data.token,
            token_expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
            last_validated_at: new Date().toISOString()
          })
          .eq('envio_user_id', user.id);

        if (updateError) {
          console.error('❌ Failed to update session:', updateError);
          return {
            success: false,
            error: `Failed to update session: ${updateError.message}`
          };
        }
      }

      console.log('✅ Session refreshed successfully');
      return {
        success: true,
        data: { token: data.token }
      };

    } catch (error) {
      console.error('❌ Session refresh error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Session refresh error'
      };
    }
  }

  async terminate(): Promise<void> {
    try {
      await enhancedGP51SessionManager.terminateSession();
      this.notifySessionSubscribers(null);
    } catch (error) {
      console.error('❌ Failed to terminate session:', error);
      throw error;
    }
  }

  isSessionValid(): boolean {
    const session = enhancedGP51SessionManager.getCurrentSession();
    return session !== null && session.expiresAt > new Date();
  }

  subscribeToSession(callback: (session: GP51Session | null) => void): () => void {
    this.sessionSubscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.sessionSubscribers.indexOf(callback);
      if (index > -1) {
        this.sessionSubscribers.splice(index, 1);
      }
    };
  }

  private notifySessionSubscribers(session: GP51Session | null): void {
    this.sessionSubscribers.forEach(callback => callback(session));
  }
}

export const consolidatedGP51Service = ConsolidatedGP51Service.getInstance();
