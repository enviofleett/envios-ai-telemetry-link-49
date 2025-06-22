
import { createContext, useContext } from 'react';
import { useUnifiedAuth } from './UnifiedAuthContext';

// Legacy AuthContext for backwards compatibility
const AuthContext = createContext<any>(null);

export const useAuth = () => {
  // Redirect to unified auth system
  const unifiedAuth = useUnifiedAuth();
  
  if (!unifiedAuth) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return {
    user: unifiedAuth.user,
    session: unifiedAuth.session,
    loading: unifiedAuth.loading,
    isAuthenticated: unifiedAuth.isAuthenticated,
    isAdmin: unifiedAuth.isAdmin,
    isAgent: unifiedAuth.isAgent,
    userRole: unifiedAuth.userRole,
    isCheckingRole: unifiedAuth.isCheckingRole,
    signIn: unifiedAuth.signIn,
    signUp: unifiedAuth.signUp,
    signOut: unifiedAuth.signOut,
    refreshSession: unifiedAuth.refreshSession,
    retryRoleCheck: unifiedAuth.retryRoleCheck,
  };
};

// Legacy provider - not needed since we use UnifiedAuthProvider
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default AuthContext;
