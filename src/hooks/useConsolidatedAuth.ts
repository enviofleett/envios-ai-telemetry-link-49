
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

/**
 * Consolidated authentication hook that ensures all components use the unified auth system.
 * This replaces all previous auth hooks and provides a single source of truth.
 */
export const useConsolidatedAuth = () => {
  const auth = useUnifiedAuth();
  
  return {
    // Core authentication state
    user: auth.user,
    session: auth.session,
    loading: auth.loading,
    isAuthenticated: auth.isAuthenticated,
    
    // Role-based access
    isAdmin: auth.isAdmin,
    isAgent: auth.isAgent,
    userRole: auth.userRole,
    isCheckingRole: auth.isCheckingRole,
    
    // Authentication actions
    signIn: auth.signIn,
    signUp: auth.signUp,
    signOut: auth.signOut,
    refreshSession: auth.refreshSession,
    retryRoleCheck: auth.retryRoleCheck,
    
    // Legacy compatibility (for gradual migration)
    getCurrentUser: () => auth.user,
    isLoading: auth.loading,
    authUser: auth.user,
  };
};

// Re-export for backwards compatibility during migration
export { useConsolidatedAuth as useAuth };
export default useConsolidatedAuth;
