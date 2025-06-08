
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

  const fetchUserRole = async (authUserId: string) => {
    try {
      console.log('Fetching role for auth user ID:', authUserId);
      
      // Use the RPC function to get user role directly with auth user ID
      const { data: roleData, error: roleError } = await supabase
        .rpc('get_user_role', { _user_id: authUserId });

      if (!roleError && roleData) {
        console.log('Role fetched successfully:', roleData);
        setUserRole(roleData);
        return;
      }

      console.log('No role found or error:', roleError);
      
      // If no role found, ensure user has envio_users record and default role
      const { data: authUser } = await supabase.auth.getUser();
      if (authUser.user) {
        // Check if envio_users record exists
        const { data: envioUser, error: envioError } = await supabase
          .from('envio_users')
          .select('id')
          .eq('id', authUserId)
          .single();
        
        if (envioError && envioError.code === 'PGRST116') {
          // Create envio_users record with auth user ID
          console.log('Creating envio_users record for auth user:', authUserId);
          await supabase
            .from('envio_users')
            .insert({
              id: authUserId,
              name: authUser.user.email?.split('@')[0] || 'User',
              email: authUser.user.email || ''
            });
        }

        // Ensure user_roles record exists with auth user ID
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authUserId)
          .single();

        if (!existingRole) {
          console.log('Creating default user role for auth user:', authUserId);
          await supabase
            .from('user_roles')
            .insert({
              user_id: authUserId,
              role: 'user'
            });
        }

        setUserRole(existingRole?.role || 'user');
      }
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
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
          // Use auth user ID directly for role operations
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session and immediately refresh role
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.id);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Force refresh the role to get the latest admin status
        fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-refresh role when component mounts to pick up the admin promotion
  useEffect(() => {
    if (user && !loading) {
      refreshUserRole();
    }
  }, [user, loading]);

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
      // Create envio_users record with the auth user ID
      console.log('Creating envio_users record for new user:', data.user.id);
      await supabase
        .from('envio_users')
        .insert({
          id: data.user.id, // Use auth user ID directly
          name,
          email
        });

      // Create default user role with auth user ID
      await supabase
        .from('user_roles')
        .insert({
          user_id: data.user.id, // Use auth user ID directly
          role: 'user'
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
