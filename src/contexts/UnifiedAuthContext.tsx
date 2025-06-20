import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { backgroundAuthService } from '@/services/auth/BackgroundAuthService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  // Add role-based properties
  isAdmin: boolean;
  isAgent: boolean;
  userRole: string | null;
  isCheckingRole: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGP51: (username: string, password: string) => Promise<{ error: AuthError | null }>; // NEW
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  retryRoleCheck: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useUnifiedAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useUnifiedAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const UnifiedAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to background auth service for optimized role checking
    const unsubscribe = backgroundAuthService.subscribe((authState) => {
      setUser(authState.user);
      setIsAdmin(authState.isAdmin);
      setIsAgent(authState.isAgent);
      setUserRole(authState.userRole);
      setIsCheckingRole(false);
    });

    // Set up auth state listener for session changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Trigger background refresh when user signs in/out
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          backgroundAuthService.refreshInBackground();
        }

        // Handle auth events
        if (event === 'SIGNED_IN' && session?.user) {
          toast({
            title: "Welcome back!",
            description: `Signed in as ${session.user.email}`,
          });
        } else if (event === 'SIGNED_OUT') {
          backgroundAuthService.clearCache();
          toast({
            title: "Signed out",
            description: "You have been successfully signed out",
          });
        }
      }
    );

    // Initialize auth state
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
      unsubscribe();
    };
  }, [toast]);

  const retryRoleCheck = async () => {
    setIsCheckingRole(true);
    await backgroundAuthService.refreshInBackground();
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
      }

      return { error };
    } catch (error) {
      const authError = error as AuthError;
      toast({
        title: "Sign In Error",
        description: "An unexpected error occurred during sign in",
        variant: "destructive",
      });
      return { error: authError };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGP51 = async (username: string, password: string) => {
    try {
      setLoading(true);
      console.log('🔐 UnifiedAuth: Starting GP51 login for:', username);

      const { data, error } = await supabase.functions.invoke('gp51-hybrid-auth', {
        body: { username: username.trim(), password }
      });

      if (error) {
        console.error('❌ GP51 hybrid auth error:', error);
        toast({
          title: "GP51 Sign In Failed",
          description: error.message || 'Failed to authenticate with GP51',
          variant: "destructive",
        });
        return { error: error as AuthError };
      }

      if (!data.success) {
        console.error('❌ GP51 authentication failed:', data.error);
        toast({
          title: "GP51 Sign In Failed",
          description: data.error || 'Invalid GP51 credentials',
          variant: "destructive",
        });
        return { error: new Error(data.error) as AuthError };
      }

      // Set session using the tokens from the response
      if (data.session?.access_token && data.session?.refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });

        if (sessionError) {
          console.error('❌ Failed to set session:', sessionError);
          toast({
            title: "Session Error",
            description: "Failed to establish session after GP51 login",
            variant: "destructive",
          });
          return { error: sessionError };
        }
      }

      console.log('✅ GP51 login successful:', {
        username,
        isNewUser: data.isNewUser,
        userEmail: data.session?.user?.email
      });

      toast({
        title: data.isNewUser ? "Welcome to FleetIQ!" : "Welcome back!",
        description: data.message || `Signed in as ${username}`,
      });

      return { error: null };

    } catch (error) {
      console.error('❌ GP51 login exception:', error);
      const authError = error as AuthError;
      toast({
        title: "GP51 Sign In Error",
        description: "An unexpected error occurred during GP51 sign in",
        variant: "destructive",
      });
      return { error: authError };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        toast({
          title: "Sign Up Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link",
        });
      }

      return { error };
    } catch (error) {
      const authError = error as AuthError;
      toast({
        title: "Sign Up Error",
        description: "An unexpected error occurred during sign up",
        variant: "destructive",
      });
      return { error: authError };
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
        toast({
          title: "Sign Out Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Session refresh error:', error);
      } else {
        // Trigger background auth refresh
        backgroundAuthService.refreshInBackground();
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    isAdmin,
    isAgent,
    userRole,
    isCheckingRole,
    signIn,
    signInWithGP51,
    signUp,
    signOut,
    refreshSession,
    retryRoleCheck,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
