
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isCheckingRole: boolean;
  isAdmin: boolean;
  userRole: string | null;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCheckingRole, setIsCheckingRole] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Memoize role check function to prevent recreation on every render
  const checkUserRole = useCallback(async (userId: string, retryCount = 0) => {
    if (retryCount === 0) {
      setIsCheckingRole(true);
    }
    
    console.log(`🔍 Checking user role for ${userId} (attempt ${retryCount + 1})`);
    
    try {
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('❌ Error checking user role:', error);
        
        // Retry up to 3 times with exponential backoff
        if (retryCount < 2) {
          const delay = Math.pow(2, retryCount) * 1000;
          console.log(`⏱️ Retrying role check in ${delay}ms...`);
          setTimeout(() => checkUserRole(userId, retryCount + 1), delay);
          return;
        }
        
        // After retries, default to user role
        console.warn('⚠️ Using default user role after failed retries');
        setUserRole('user');
        setIsAdmin(false);
      } else if (roleData) {
        console.log('✅ User role retrieved:', roleData.role);
        setUserRole(roleData.role);
        setIsAdmin(roleData.role === 'admin');
      } else {
        console.log('📝 No role found, defaulting to user');
        setUserRole('user');
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('❌ Exception during role check:', error);
      
      // Retry logic for exceptions as well
      if (retryCount < 2) {
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => checkUserRole(userId, retryCount + 1), delay);
        return;
      }
      
      setUserRole('user');
      setIsAdmin(false);
    } finally {
      if (retryCount === 0 || retryCount >= 2) {
        setIsCheckingRole(false);
      }
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        console.log('🔍 Initial session check:', session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Check user role if session exists
        if (session?.user) {
          checkUserRole(session.user.id);
        }
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Check user role when session changes
        if (session?.user) {
          checkUserRole(session.user.id);
        } else {
          setIsAdmin(false);
          setUserRole(null);
          setIsCheckingRole(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [checkUserRole]);

  const retryRoleCheck = useCallback(async () => {
    if (user?.id) {
      await checkUserRole(user.id);
    }
  }, [user?.id, checkUserRole]);

  const signOut = useCallback(async () => {
    console.log('👋 Signing out user');
    await supabase.auth.signOut();
    setIsAdmin(false);
    setUserRole(null);
    setIsCheckingRole(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  }, []);

  const signUp = useCallback(async (email: string, password: string, name?: string, packageType?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          package_type: packageType,
        },
      },
    });
    return { error };
  }, []);

  const refreshUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      await checkUserRole(user.id);
    }
  }, [checkUserRole]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    session,
    loading,
    isCheckingRole,
    isAdmin,
    userRole,
    signOut,
    signIn,
    signUp,
    refreshUser,
    retryRoleCheck,
  }), [
    user,
    session,
    loading,
    isCheckingRole,
    isAdmin,
    userRole,
    signOut,
    signIn,
    signUp,
    refreshUser,
    retryRoleCheck,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
