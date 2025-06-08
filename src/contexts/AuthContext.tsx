import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  userRole: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, packageId: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  // Function to fetch user role
  const fetchUserRole = async (userId: string) => {
    try {
      console.log('🔍 AuthContext: Fetching user role for userId:', userId);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.log('⚠️ AuthContext: No role found for user, defaulting to user role. Error:', error);
        setUserRole('user');
        setIsAdmin(false);
        return;
      }

      const role = data?.role || 'user';
      console.log('✅ AuthContext: User role fetched successfully:', role);
      setUserRole(role);
      setIsAdmin(role === 'admin');
    } catch (error) {
      console.error('❌ AuthContext: Error fetching user role:', error);
      setUserRole('user');
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    console.log('🚀 AuthContext: Setting up auth state listener');
    
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 AuthContext: Auth event received:', event, 'User email:', session?.user?.email || 'none');
        console.log('🔄 AuthContext: Session object:', session ? 'exists' : 'null');
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user role when user signs in
        if (session?.user) {
          console.log('👤 AuthContext: User authenticated, fetching role...');
          await fetchUserRole(session.user.id);
        } else {
          console.log('👤 AuthContext: No user, clearing role state');
          setUserRole(null);
          setIsAdmin(false);
        }
        
        setLoading(false);
        console.log('✅ AuthContext: Auth state update complete. Loading set to false.');

        // Handle specific auth events
        if (event === 'SIGNED_IN') {
          console.log('🎉 AuthContext: SIGNED_IN event - showing welcome toast');
          toast({
            title: "Welcome!",
            description: "Successfully signed in.",
          });
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 AuthContext: SIGNED_OUT event - showing goodbye toast');
          toast({
            title: "Goodbye!",
            description: "Successfully signed out.",
          });
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 AuthContext: Token refreshed successfully');
        }
      }
    );

    // Check for existing session
    console.log('🔍 AuthContext: Checking for existing session...');
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.error('❌ AuthContext: Error getting session:', error);
      } else {
        console.log('📝 AuthContext: Initial session check:', session ? 'session exists' : 'no session');
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      // Fetch user role for existing session
      if (session?.user) {
        console.log('👤 AuthContext: Initial session has user, fetching role...');
        await fetchUserRole(session.user.id);
      }
      
      setLoading(false);
      console.log('✅ AuthContext: Initial setup complete. Loading set to false.');
    });

    return () => {
      console.log('🔌 AuthContext: Unsubscribing from auth state listener');
      subscription.unsubscribe();
    };
  }, [toast]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 AuthContext: Sign in attempt started for:', email);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ AuthContext: Sign in error:', error);
        return { error };
      }

      console.log('✅ AuthContext: Sign in successful for:', email);
      console.log('📝 AuthContext: Sign in data:', data ? 'exists' : 'null');
      return { error: null };
    } catch (error) {
      console.error('❌ AuthContext: Unexpected sign in error:', error);
      return { error };
    } finally {
      setLoading(false);
      console.log('🏁 AuthContext: Sign in process complete. Loading set to false.');
    }
  };

  const signUp = async (email: string, password: string, fullName: string, packageId: string) => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            package_id: packageId,
          }
        }
      });

      if (error) {
        console.error('Sign up error:', error);
        return { error };
      }

      // Create user profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('envio_users')
          .insert({
            id: data.user.id,
            email: email,
            name: fullName,
            registration_type: 'self',
            registration_status: 'pending',
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }

        // Set default role as 'user'
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role: 'user'
          });

        if (roleError) {
          console.error('Role creation error:', roleError);
        }
      }

      return { error: null };
    } catch (error) {
      console.error('Unexpected sign up error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      // Clear role state on sign out
      setUserRole(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Unexpected sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error('Password reset error:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Unexpected password reset error:', error);
      return { error };
    }
  };

  const value = {
    user,
    session,
    loading,
    isAdmin,
    userRole,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  console.log('🔍 AuthContext: Current state - User:', user?.email || 'none', 'Loading:', loading, 'Role:', userRole);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
