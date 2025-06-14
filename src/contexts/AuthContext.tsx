import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const mountedRef = useRef(true);
  const roleCheckTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (roleCheckTimeoutRef.current) {
        clearTimeout(roleCheckTimeoutRef.current);
      }
    };
  }, []);

  const checkUserRole = useCallback(async (userId: string, options: { isBackground?: boolean; retryCount?: number } = {}) => {
    const { isBackground = false, retryCount = 0 } = options;
    if (!mountedRef.current) return;
    
    if (!isBackground && retryCount === 0) {
      setIsCheckingRole(true);
    }
    
    try {
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (!mountedRef.current) return;

      if (error) {
        console.error('Error checking user role:', error);
        
        if (retryCount < 1) {
          const delay = Math.pow(2, retryCount) * 1000;
          roleCheckTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              checkUserRole(userId, { ...options, retryCount: retryCount + 1 });
            }
          }, delay);
          return;
        }
        
        console.warn('Using default user role after failed retries');
        setUserRole('user');
        setIsAdmin(false);
      } else if (roleData) {
        setUserRole(roleData.role);
        setIsAdmin(roleData.role === 'admin');
      } else {
        setUserRole('user');
        setIsAdmin(false);
      }
    } catch (error) {
      if (!mountedRef.current) return;
      console.error('Exception during role check:', error);
      
      if (retryCount < 1) {
        const delay = Math.pow(2, retryCount) * 1000;
        roleCheckTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            checkUserRole(userId, { ...options, retryCount: retryCount + 1 });
          }
        }, delay);
        return;
      }
      
      setUserRole('user');
      setIsAdmin(false);
    } finally {
      if (mountedRef.current) {
        const isFinalAttempt = retryCount >= 1;
        if (!isBackground && (retryCount === 0 || isFinalAttempt)) {
          setIsCheckingRole(false);
        }
      }
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mountedRef.current) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        if (session?.user) {
          checkUserRole(session.user.id);
        } else {
          setIsCheckingRole(false);
        }
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (mountedRef.current) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (event === 'SIGNED_IN' && session?.user) {
          checkUserRole(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setIsAdmin(false);
          setUserRole(null);
          setIsCheckingRole(false);
        } else if (event === 'USER_UPDATED' && session?.user) {
          checkUserRole(session.user.id, { isBackground: true });
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkUserRole]);

  const refreshUser = useCallback(async () => {
    if (!mountedRef.current) return;
    
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (mountedRef.current) {
      setUser(authUser);
      if (authUser) {
        await checkUserRole(authUser.id, { isBackground: true });
      }
    }
  }, [checkUserRole]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (user && document.visibilityState === 'visible') {
        refreshUser();
      }
    }, 5 * 60 * 1000); // every 5 minutes

    return () => clearInterval(intervalId);
  }, [user, refreshUser]);

  const retryRoleCheck = useCallback(async () => {
    if (user?.id && mountedRef.current) {
      await checkUserRole(user.id, { isBackground: false });
    }
  }, [user?.id, checkUserRole]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    if (mountedRef.current) {
      setIsAdmin(false);
      setUserRole(null);
      setIsCheckingRole(false);
    }
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
