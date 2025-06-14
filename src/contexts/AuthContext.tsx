
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { authService } from '@/services/auth/AuthService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isCheckingRole: boolean;
  isAdmin: boolean;
  userRole: string | null;
  isPlatformAdmin: boolean; // NEW
  platformAdminRoles: string[]; // NEW
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ data?: any; error: any }>;
  signUp: (email: string, password: string, name?: string, packageType?: string) => Promise<{ error: any }>;
  refreshUser: () => Promise<void>;
  retryRoleCheck: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState(authService.getState());

  useEffect(() => {
    const unsubscribe = authService.subscribe(setAuthState);
    return () => unsubscribe();
  }, []);

  const contextValue = useMemo(() => ({
    ...authState,
    signOut: authService.signOut,
    signIn: authService.signIn,
    signUp: authService.signUp,
    refreshUser: authService.refreshUser,
    retryRoleCheck: authService.retryRoleCheck,
    isPlatformAdmin: authState.isPlatformAdmin,
    platformAdminRoles: authState.platformAdminRoles,
  }), [authState]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
