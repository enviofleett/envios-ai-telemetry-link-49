
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
  const [isCheckingRole, setIsCheckingRole] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const mountedRef = useRef(true);
  const roleCheckTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (roleCheckTimeoutRef.current) {
        clearTimeout(roleCheckTimeoutRef.current);
      }
    };
  }, []);

  const checkUserRole = useCallback(async (userId: string, retryCount = 0) => {
    if (!mountedRef.current) return;
    
    if (retryCount === 0) {
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
              checkUserRole(userId, retryCount + 1);
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
            checkUserRole(userId, retryCount + 1);
          }
        }, delay);
        return;
      }
      
      setUserRole('user');
      setIsAdmin(false);
    } finally {
      if (mountedRef.current && (retryCount === 0 || retryCount >= 1)) {
        setIsCheckingRole(false);
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
      subscription.unsubscribe();
    };
  }, [checkUserRole]);

  const retryRoleCheck = useCallback(async () => {
    if (user?.id && mountedRef.current) {
      await checkUserRole(user.id);
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

  const refreshUser = useCallback(async () => {
    if (!mountedRef.current) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (mountedRef.current) {
      setUser(user);
      if (user) {
        await checkUserRole(user.id);
      }
    }
  }, [checkUserRole]);

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
