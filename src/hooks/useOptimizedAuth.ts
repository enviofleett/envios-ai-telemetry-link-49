
import { useState, useEffect, useCallback } from 'react';
import { backgroundAuthService } from '@/services/auth/BackgroundAuthService';
import { User } from '@supabase/supabase-js';

interface OptimizedAuthState {
  user: User | null;
  isAdmin: boolean;
  isAgent: boolean;
  userRole: string | null;
  isPlatformAdmin: boolean;
  platformAdminRoles: string[];
  loading: boolean;
  isStale: boolean; // Indicates if data might be stale and refreshing in background
}

export const useOptimizedAuth = () => {
  const [authState, setAuthState] = useState<OptimizedAuthState>({
    user: null,
    isAdmin: false,
    isAgent: false,
    userRole: null,
    isPlatformAdmin: false,
    platformAdminRoles: [],
    loading: true,
    isStale: false
  });

  useEffect(() => {
    // Try to get cached data immediately
    const cachedState = backgroundAuthService.getCachedState();
    
    if (cachedState) {
      setAuthState({
        user: cachedState.user,
        isAdmin: cachedState.isAdmin,
        isAgent: cachedState.isAgent,
        userRole: cachedState.userRole,
        isPlatformAdmin: cachedState.isPlatformAdmin,
        platformAdminRoles: cachedState.platformAdminRoles,
        loading: false,
        isStale: false
      });
    } else {
      // No cached data, show loading but trigger background refresh
      setAuthState(prev => ({ ...prev, loading: true, isStale: true }));
      backgroundAuthService.refreshInBackground();
    }

    // Subscribe to auth updates
    const unsubscribe = backgroundAuthService.subscribe((newState) => {
      setAuthState({
        user: newState.user,
        isAdmin: newState.isAdmin,
        isAgent: newState.isAgent,
        userRole: newState.userRole,
        isPlatformAdmin: newState.isPlatformAdmin,
        platformAdminRoles: newState.platformAdminRoles,
        loading: false,
        isStale: false
      });
    });

    return unsubscribe;
  }, []);

  const forceRefresh = useCallback(() => {
    setAuthState(prev => ({ ...prev, isStale: true }));
    backgroundAuthService.refreshInBackground();
  }, []);

  const retryRoleCheck = useCallback(() => {
    forceRefresh();
  }, [forceRefresh]);

  return {
    ...authState,
    forceRefresh,
    retryRoleCheck,
    // Legacy compatibility
    isAuthenticated: !!authState.user,
    isCheckingRole: authState.loading,
    session: null // We don't cache session for security reasons
  };
};
