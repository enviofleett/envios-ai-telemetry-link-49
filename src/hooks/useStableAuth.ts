
import { useMemo } from 'react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

export const useStableAuth = () => {
  const auth = useUnifiedAuth();
  
  // Memoize auth state to prevent unnecessary re-renders
  return useMemo(() => ({
    user: auth.user,
    // For now, provide default values since UnifiedAuth doesn't have role checking yet
    isAdmin: false, // TODO: Add role checking when UnifiedAuth supports it
    isAgent: false, // TODO: Add role checking when UnifiedAuth supports it
    userRole: 'user', // TODO: Add role checking when UnifiedAuth supports it
    isCheckingRole: false,
    loading: auth.loading,
    session: auth.session,
    // Map the UnifiedAuth methods
    signOut: auth.signOut,
    // Note: retryRoleCheck not available in UnifiedAuth yet
    retryRoleCheck: () => Promise.resolve(), // TODO: Implement when UnifiedAuth supports roles
  }), [
    auth.user,
    auth.loading,
    auth.session,
    auth.signOut
  ]);
};
