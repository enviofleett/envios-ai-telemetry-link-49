
interface GP51AuthState {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  username?: string;
  tokenExpiresAt?: Date;
  lastValidated?: Date;
  error?: string;
}

export class GP51AuthStateManager {
  private state: GP51AuthState = {
    isAuthenticated: false,
    isAuthenticating: false
  };
  
  private listeners: Array<(state: GP51AuthState) => void> = [];
  private authLock = false;

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
        error: details?.error
      };

      console.log(`🔄 Auth state updated:`, {
        isAuthenticated: this.state.isAuthenticated,
        username: this.state.username,
        hasError: !!this.state.error
      });

      this.notifyListeners();

      // Add delay for session persistence on successful authentication
      if (authenticated && !details?.error) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('✅ Session persistence delay completed');
      }
    } finally {
      this.authLock = false;
    }
  }

  isLocked(): boolean {
    return this.authLock;
  }

  clearError() {
    this.state = { ...this.state, error: undefined };
    this.notifyListeners();
  }
}

export const gp51AuthStateManager = new GP51AuthStateManager();
