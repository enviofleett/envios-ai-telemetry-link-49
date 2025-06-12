
import React, { createContext, useContext, useEffect, useState } from 'react';
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

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔍 Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🔄 Auth state changed:', _event, session?.user?.email);
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
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRole = async (userId: string, retryCount = 0) => {
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
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000;
          console.log(`⏱️ Retrying role check in ${delay}ms...`);
          setTimeout(() => checkUserRole(userId, retryCount + 1), delay);
          return;
        }
        
        // After 3 retries, default to user role
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
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => checkUserRole(userId, retryCount + 1), delay);
        return;
      }
      
      setUserRole('user');
      setIsAdmin(false);
    } finally {
      if (retryCount === 0 || retryCount >= 3) {
        setIsCheckingRole(false);
      }
    }
  };

  const retryRoleCheck = async () => {
    if (user?.id) {
      await checkUserRole(user.id);
    }
  };

  const signOut = async () => {
    console.log('👋 Signing out user');
    await supabase.auth.signOut();
    setIsAdmin(false);
    setUserRole(null);
    setIsCheckingRole(false);
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Attempting sign in for:', email);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, name?: string, packageType?: string) => {
    console.log('📝 Sign up not fully implemented - service being rebuilt');
    return { error: new Error('Sign up service is being rebuilt') };
  };

  const refreshUser = async () => {
    console.log('🔄 Refreshing user data');
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      checkUserRole(user.id);
    }
  };

  const value = {
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
