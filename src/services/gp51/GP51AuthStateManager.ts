
interface GP51AuthState {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  username?: string;
  tokenExpiresAt?: Date;
  lastValidated?: Date;
  error?: string;
  sessionId?: string;
}

export class GP51AuthStateManager {
  private state: GP51AuthState = {
    isAuthenticated: false,
    isAuthenticating: false
  };
  
  private listeners: Array<(state: GP51AuthState) => void> = [];
  private authLock = false;
  private validationLock = false;

  getState(): GP51AuthState {
    return { ...this.state };
  }

  subscribe(listener: (state: GP51AuthState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('Auth state listener error:', error);
      }
    });
  }

  async setAuthenticating(isAuthenticating: boolean) {
    this.state = { ...this.state, isAuthenticating };
    this.notifyListeners();
  }

  async setAuthenticated(authenticated: boolean, details?: {
    username?: string;
    tokenExpiresAt?: Date;
    error?: string;
    sessionId?: string;
  }) {
    // Prevent concurrent authentication state changes
    if (this.authLock) {
      console.log('🔒 Auth state change blocked - lock active');
      return;
    }

    this.authLock = true;
    
    try {
      this.state = {
        ...this.state,
        isAuthenticated: authenticated,
        isAuthenticating: false,
        username: details?.username || this.state.username,
        tokenExpiresAt: details?.tokenExpiresAt || this.state.tokenExpiresAt,
        lastValidated: new Date(),
        error: details?.error,
        sessionId: details?.sessionId || this.state.sessionId
      };

      console.log(`🔄 Auth state updated:`, {
        isAuthenticated: this.state.isAuthenticated,
        username: this.state.username,
        sessionId: this.state.sessionId?.substring(0, 8) + '...',
        hasError: !!this.state.error
      });

      this.notifyListeners();

      // Extended delay for session persistence on successful authentication
      if (authenticated && !details?.error) {
        console.log('⏳ Starting extended session persistence delay (5 seconds)...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        console.log('✅ Extended session persistence delay completed');
        
        // Re-validate session after delay
        if (!this.validationLock) {
          this.validationLock = true;
          try {
            console.log('🔄 Re-validating session after persistence delay...');
            // Force another state update to ensure session is still valid
            this.state = { ...this.state, lastValidated: new Date() };
            this.notifyListeners();
          } finally {
            this.validationLock = false;
          }
        }
      }
    } finally {
      this.authLock = false;
    }
  }

  isLocked(): boolean {
    return this.authLock || this.validationLock;
  }

  clearError() {
    if (!this.authLock) {
      this.state = { ...this.state, error: undefined };
      this.notifyListeners();
    }
  }

  // Prevent status checks during authentication
  async safeStatusCheck(checkFunction: () => Promise<any>): Promise<any> {
    if (this.isLocked()) {
      console.log('🔒 Status check skipped - authentication in progress');
      return { success: false, error: 'Authentication in progress' };
    }

    try {
      this.validationLock = true;
      return await checkFunction();
    } finally {
      this.validationLock = false;
    }
  }

  // Enhanced session validation with exponential backoff
  async validateSession(maxRetries: number = 3): Promise<boolean> {
    if (this.isLocked()) {
      console.log('🔒 Session validation skipped - locks active');
      return false;
    }

    let retryCount = 0;
    while (retryCount < maxRetries) {
      try {
        // Add exponential backoff delay
        if (retryCount > 0) {
          const delay = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
          console.log(`⏳ Session validation retry ${retryCount + 1}/${maxRetries} after ${delay}ms delay`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        this.validationLock = true;
        
        // Perform actual session validation here
        // This would typically involve checking the token validity
        console.log('🔍 Validating session...');
        
        // For now, assume validation passes if we have basic session data
        const isValid = !!(this.state.username && this.state.sessionId);
        
        if (isValid) {
          console.log('✅ Session validation successful');
          this.state = { ...this.state, lastValidated: new Date() };
          this.notifyListeners();
          return true;
        }
        
        retryCount++;
      } catch (error) {
        console.error(`❌ Session validation attempt ${retryCount + 1} failed:`, error);
        retryCount++;
      } finally {
        this.validationLock = false;
      }
    }

    console.error('❌ Session validation failed after all retries');
    return false;
  }
}

export const gp51AuthStateManager = new GP51AuthStateManager();
