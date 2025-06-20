
import { useMemo } from 'react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

export const useStableAuth = () => {
  const auth = useUnifiedAuth();
  
  // Memoize auth state to prevent unnecessary re-renders
  return useMemo(() => ({
    user: auth.user,
    isAdmin: auth.isAdmin,
    isAgent: auth.isAgent,
    userRole: auth.userRole,
    isCheckingRole: auth.isCheckingRole,
    loading: auth.loading,
    session: auth.session,
    signOut: auth.signOut,
    retryRoleCheck: auth.retryRoleCheck,
  }), [
    auth.user,
    auth.isAdmin,
    auth.isAgent,
    auth.userRole,
    auth.isCheckingRole,
    auth.loading,
    auth.session,
    auth.signOut,
    auth.retryRoleCheck
  ]);
};
