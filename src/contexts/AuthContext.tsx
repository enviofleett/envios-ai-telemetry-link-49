
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: any | null;
  userRole: string | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  isAdmin: false,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  refreshUserRole: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    try {
      console.log('Fetching role for auth user ID:', userId);
      
      // Use the auth user ID directly to get the role
      const { data, error } = await supabase.functions.invoke('user-management/roles/current');
      
      if (!error && data) {
        console.log('Role fetched successfully:', data.role);
        setUserRole(data.role);
      } else {
        console.error('Error fetching user role:', error);
        
        // If no role found, ensure user has a default role
        if (error?.message?.includes('not found') || !data?.role) {
          console.log('No role found, setting default role and creating envio user record');
          
          // Create envio user record if it doesn't exist
          const { data: envioUser, error: envioError } = await supabase
            .from('envio_users')
            .select('id')
            .eq('id', userId)
            .single();
          
          if (envioError && envioError.code === 'PGRST116') {
            // User doesn't exist in envio_users, create it
            const { data: authUser } = await supabase.auth.getUser();
            if (authUser.user) {
              await supabase
                .from('envio_users')
                .insert({
                  id: userId,
                  name: authUser.user.email?.split('@')[0] || 'User',
                  email: authUser.user.email || ''
                });
            }
          }
          
          setUserRole('user'); // Default role
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('user'); // Default to user role
    }
  };

  const refreshUserRole = async () => {
    if (user) {
      await fetchUserRole(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer role fetching to prevent auth state change conflicts
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.id);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, name: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    if (!error && data.user) {
      // Create envio user record with the auth user ID
      await supabase.functions.invoke('user-management', {
        body: { name, email }
      });
    }
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
  };

  const value = {
    user,
    userRole,
    isAdmin: userRole === 'admin',
    loading,
    signIn,
    signUp,
    signOut,
    refreshUserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
