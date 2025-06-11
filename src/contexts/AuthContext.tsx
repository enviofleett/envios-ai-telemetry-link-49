
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { PackageMappingService } from '@/services/packageMappingService';

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, name: string, selectedPackage: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await checkAdminRole(session.user.id);
        } else {
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .single();

      setIsAdmin(!error && data !== null);
    } catch (error) {
      console.error('Error checking admin role:', error);
      setIsAdmin(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        await checkAdminRole(data.user.id);
      }

      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signUp = async (email: string, password: string, name: string, selectedPackage: string) => {
    try {
      // 1. Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          }
        }
      });

      if (authError) {
        return { error: authError };
      }

      if (!authData.user) {
        return { error: new Error('User creation failed') as AuthError };
      }

      // 2. Create user profile in envio_users
      const { data: envioUser, error: envioUserError } = await supabase
        .from('envio_users')
        .insert({
          id: authData.user.id,
          name: name,
          email: email,
          registration_type: 'self_registration',
          registration_status: 'active'
        })
        .select()
        .single();

      if (envioUserError) {
        console.error('Failed to create envio user:', envioUserError);
        return { error: new Error(envioUserError.message) as AuthError };
      }

      // 3. Assign package to user
      const packageAssignment = await PackageMappingService.assignPackageToUser(
        authData.user.id,
        selectedPackage,
        'monthly'
      );

      if (!packageAssignment.success) {
        console.error('Package assignment failed:', packageAssignment.error);
        // Don't fail signup, but log the issue
      }

      // 4. Set default user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'user'
        });

      if (roleError) {
        console.error('Failed to assign default role:', roleError);
      }

      // 5. Check if user should have admin role based on package
      const packageInfo = PackageMappingService.getPackageInfo(selectedPackage);
      if (packageInfo?.gp51UserType === 2) {
        await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'admin'
          });
        setIsAdmin(true);
      }

      return { error: null };
    } catch (error) {
      console.error('Signup error:', error);
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
  };

  const value = {
    user,
    signIn,
    signUp,
    signOut,
    loading,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
