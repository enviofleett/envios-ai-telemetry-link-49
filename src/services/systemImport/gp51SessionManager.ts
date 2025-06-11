
// Stub implementation for GP51 session manager
export class GP51SessionManager {
  async validateSession(): Promise<boolean> {
    return false;
  }

  async refreshSession(): Promise<boolean> {
    return false;
  }

  getSessionInfo() {
    return null;
  }
}

export const gp51SessionManager = new GP51SessionManager();
