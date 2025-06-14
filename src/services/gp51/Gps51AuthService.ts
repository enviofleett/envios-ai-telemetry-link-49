
import { supabase } from '@/integrations/supabase/client';
// import { crossBrowserMD5 } from '@/utils/crossBrowserMD5'; // Not needed here if gp51-auth-service handles hashing

export interface AuthResult {
  success: boolean;
  token?: string;
  error?: string;
  sessionId?: string; // Corresponds to gp51_sessions table id
  username?: string; // Return username from successful auth
  method?: string; // Auth method used by gp51-auth-service
}

export interface GP51Credentials {
  username: string;
  password: string;
  apiUrl?: string; // API URL can be passed if needed by gp51-auth-service
}

export interface AuthStatus {
  isAuthenticated: boolean;
  username?: string;
  tokenExpiresAt?: Date;
  // Add other relevant fields from currentSession if needed
}

export class Gps51AuthService {
  private static instance: Gps51AuthService;
  private currentSession: { // Define a more specific type for currentSession
    id?: string; // from gp51_sessions
    envio_user_id?: string;
    username?: string;
    gp51_token?: string;
    token_expires_at?: string;
    auth_method?: string;
  } | null = null;

  private constructor() {
    // Attempt to load session on init? Could be complex, rely on useGP51Auth for now.
  }

  static getInstance(): Gps51AuthService {
    if (!Gps51AuthService.instance) {
      Gps51AuthService.instance = new Gps51AuthService();
    }
    return Gps51AuthService.instance;
  }

  async login(username: string, password: string, apiUrl?: string): Promise<AuthResult> {
    try {
      console.log('🔐 GP51 Login attempt for user via Gps51AuthService:', username);
      const result = await this.authenticate({ username, password, apiUrl });
      
      if (result.success) {
        console.log('✅ GP51 login successful via Gps51AuthService. Session ID:', result.sessionId);
        // The currentSession should be updated based on the result from gp51-auth-service
        // which includes details of the newly created/updated session in gp51_sessions.
        this.currentSession = {
            // id: result.sessionId, // Assuming gp51-auth-service returns this
            username: result.username,
            gp51_token: result.token,
            // token_expires_at: result.tokenExpiresAt, // Assuming gp51-auth-service returns this
            auth_method: result.method,
        };
      } else {
        console.error('❌ GP51 login failed via Gps51AuthService:', result.error);
        this.currentSession = null;
      }
      
      return result;
    } catch (error) {
      console.error('❌ GP51 login exception in Gps51AuthService:', error);
      this.currentSession = null;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed due to an unexpected error'
      };
    }
  }

  async logout(): Promise<AuthResult> {
    try {
      console.log('👋 GP51 Logout initiated via Gps51AuthService');
      // To properly logout, we should invalidate the session in `gp51_sessions` table.
      // This could be an action in `gp51-auth-service` or `gp51-service-management`.
      // For now, just clear local session.
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Call an edge function to mark the user's GP51 sessions as inactive or delete them
        // For simplicity, we'll just clear the local state. A robust logout would update the backend.
        await supabase
          .from('gp51_sessions')
          .delete()
          .eq('envio_user_id', user.id); // Or match on username if envio_user_id is not reliably set
      }
      this.currentSession = null;
      console.log('✅ GP51 client-side logout successful');
      return { success: true };
    } catch (error) {
      console.error('❌ GP51 logout failed in Gps51AuthService:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed'
      };
    }
  }

  async getToken(): Promise<string | null> {
    // This should fetch the *active* session token from `gp51_sessions` for the current user.
    // This logic might be better suited in gp51SessionManager or a dedicated hook state.
    try {
      if (this.currentSession?.gp51_token && this.currentSession.token_expires_at && new Date(this.currentSession.token_expires_at) > new Date()) {
        return this.currentSession.gp51_token;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No Supabase user, cannot get GP51 token.');
        return null;
      }

      // Fetch the latest, valid session from the database.
      // Note: 'envio_user_id' should be reliably populated in gp51_sessions.
      // If 'username' is the primary key for GP51 identity, adjust accordingly.
      const { data: sessions, error } = await supabase
        .from('gp51_sessions')
        .select('gp51_token, token_expires_at, username, auth_method, id')
        .eq('envio_user_id', user.id) // Assuming envio_user_id is set. Otherwise, may need to match on username.
        // .eq('username', this.currentSession?.username) // Alternative if username is more reliable
        .order('last_validated_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('❌ Error fetching GP51 session from DB:', error);
        return null;
      }

      if (sessions && sessions.length > 0) {
        const session = sessions[0];
        if (new Date(session.token_expires_at) > new Date()) {
          this.currentSession = session; // Update local cache
          return session.gp51_token;
        } else {
          console.log('GP51 session found in DB but is expired.');
          await this.clearSession(); // Clear expired session
        }
      } else {
        console.log('No active GP51 session found in DB for current user.');
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get GP51 token:', error);
      return null;
    }
  }

  async healthCheck(): Promise<boolean> {
    // Health check should use an existing valid session.
    // It can call `gp51-connection-check` edge function.
    console.log('🏥 Gps51AuthService: Performing health check...');
    try {
      const token = await this.getToken();
      if (!token) {
        console.log('No active token for health check.');
        return false;
      }
      // If gp51-connection-check expects a token to be passed, do that.
      // Or it might infer user and session from Supabase context.
      const { data, error } = await supabase.functions.invoke('gp51-connection-check', {
        body: { testConnectivity: true } // gp51-connection-check might need token or use server-side session
      });

      if (error) {
        console.error('❌ Health check invocation failed:', error);
        return false;
      }
      console.log('✅ Health check result:', data);
      return data?.success === true;
    } catch (error) {
      console.error('❌ GP51 health check failed:', error);
      return false;
    }
  }

  getAuthStatus(): AuthStatus {
    // This should reflect the state of `this.currentSession`
    // and potentially check its expiry.
    if (this.currentSession && this.currentSession.gp51_token && this.currentSession.token_expires_at) {
      const expiresAt = new Date(this.currentSession.token_expires_at);
      if (expiresAt > new Date()) {
        return {
          isAuthenticated: true,
          username: this.currentSession.username,
          tokenExpiresAt: expiresAt,
        };
      }
    }
    return { isAuthenticated: false };
  }

  // This is the core authentication method that should call the gp51-auth-service.
  async authenticate(credentials: GP51Credentials): Promise<AuthResult> {
    try {
      console.log(`🔐 Calling 'gp51-auth-service' for user: ${credentials.username}`);
      
      const { data, error } = await supabase.functions.invoke('gp51-auth-service', {
        body: {
          action: 'test_authentication', // This is the action defined in gp51-auth-service
          username: credentials.username,
          password: credentials.password,
          // apiUrl: credentials.apiUrl, // Pass if gp51-auth-service uses it
        }
      });

      if (error) {
        console.error('❌ Error invoking gp51-auth-service:', error);
        return { success: false, error: error.message || 'Failed to connect to auth service' };
      }

      if (data.success) {
        console.log(`✅ gp51-auth-service successful for ${data.username}, method: ${data.method}. Token preview: ${data.token?.substring(0,5)}...`);
        // `gp51-auth-service` is responsible for saving the session to `gp51_sessions` table.
        // We can update `this.currentSession` based on the response.
        this.currentSession = {
          username: data.username,
          gp51_token: data.token,
          // token_expires_at: data.token_expires_at, // ensure gp51-auth-service returns this
          auth_method: data.method,
          // id: data.sessionId // ensure gp51-auth-service returns this
        };
        return { 
            success: true, 
            token: data.token, 
            username: data.username, 
            method: data.method,
            // sessionId: data.sessionId 
        };
      } else {
        console.error('❌ gp51-auth-service reported failure:', data.error);
        return { success: false, error: data.error || 'Authentication failed via auth service' };
      }

    } catch (error) {
      console.error('❌ Exception during Gps51AuthService.authenticate:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication process failed'
      };
    }
  }

  async testConnection(credentials: GP51Credentials): Promise<{ success: boolean; error?: string }> {
    // This should use the `healthCheck` or a similar mechanism that relies on an existing session.
    // If explicitly testing new credentials without saving, it could call gp51-auth-service
    // with a specific "test_only" flag if that service supports it.
    // For now, let's assume testConnection means testing current session validity.
    console.log('🧪 Testing GP51 connection via Gps51AuthService...');
    const isHealthy = await this.healthCheck();
    if (isHealthy) {
      return { success: true };
    } else {
      return { success: false, error: "Connection test failed or no active session." };
    }
  }

  async saveCredentials(credentials: GP51Credentials): Promise<AuthResult> {
    // Saving credentials means re-authenticating and establishing a new session.
    console.log(`💾 Saving credentials and re-authenticating for user: ${credentials.username}`);
    return this.login(credentials.username, credentials.password, credentials.apiUrl);
  }

  async getConnectionStatus(): Promise<{ connected: boolean; username?: string; error?: string; lastCheck?: Date }> {
    // This should reflect the current state of authentication.
    // It can use `gp51-service-management` 'get-gp51-status' which should check `gp51_sessions`.
    console.log('📊 Getting connection status via Gps51AuthService...');
    try {
        const { data, error } = await supabase.functions.invoke('gp51-service-management', {
            body: { action: 'get-gp51-status' }
        });

        if (error) {
            console.error('Error invoking get-gp51-status:', error.message);
            return { connected: false, error: error.message, lastCheck: new Date() };
        }
        
        // Update local session cache if status is connected and provides session details
        if (data.success && data.username && data.token_expires_at) {
            this.currentSession = {
                ...this.currentSession, // preserve other fields if any
                username: data.username,
                token_expires_at: data.token_expires_at,
                // gp51_token: data.token // if provided
            };
        } else if (!data.success) {
            // If status is not connected, clear local session potentially
            // Only if the error indicates invalid session, not just transient network issue
            // this.currentSession = null; 
        }

        return {
            connected: data.success || false,
            username: data.username,
            error: data.error,
            lastCheck: new Date()
        };
    } catch (e) {
        console.error('Exception in getConnectionStatus:', e);
        return { 
            connected: false, 
            error: e instanceof Error ? e.message : 'Failed to check status due to an unexpected error',
            lastCheck: new Date()
        };
    }
  }

  async clearSession(): Promise<void> {
    // This is a client-side clear. Backend session invalidation should also occur.
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        // It's better to call an edge function to "logout" from GP51 session perspective
        // e.g., mark session as inactive or delete it from `gp51_sessions`
        // This is a simplified client-side clear
        await supabase.from('gp51_sessions').delete().eq('envio_user_id', user.id);
    }
    this.currentSession = null;
    console.log('GP51 client-side session cleared in Gps51AuthService');
  }

  getCurrentSession() {
    // May need to refresh from DB if stale
    return this.currentSession;
  }

  isAuthenticated(): boolean {
    // Basic check, could be enhanced with expiry validation
    return this.currentSession !== null && !!this.currentSession.gp51_token &&
           this.currentSession.token_expires_at !== undefined && new Date(this.currentSession.token_expires_at) > new Date();
  }
}

// Export the singleton instance
export const gps51AuthService = Gps51AuthService.getInstance();

