
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useStableAuth = () => {
  const auth = useAuth();
  
  // Memoize auth state to prevent unnecessary re-renders
  return useMemo(() => ({
    user: auth.user,
    isAdmin: auth.isAdmin,
    isAgent: auth.isAgent,
    userRole: auth.userRole,
    isCheckingRole: auth.isCheckingRole,
    loading: auth.loading,
    session: auth.session,
    // Only include functions that are actually needed
    retryRoleCheck: auth.retryRoleCheck,
    signOut: auth.signOut
  }), [
    auth.user,
    auth.isAdmin, 
    auth.isAgent,
    auth.userRole,
    auth.isCheckingRole,
    auth.loading,
    auth.session,
    auth.retryRoleCheck,
    auth.signOut
  ]);
};
