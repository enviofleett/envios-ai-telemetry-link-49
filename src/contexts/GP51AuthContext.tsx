
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { gp51FallbackAuth, AuthenticationLevel } from '@/services/auth/GP51FallbackAuthService';

interface GP51AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authLevel: AuthenticationLevel;
  signIn: (username: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  retryConnection: () => Promise<void>;
}

const GP51AuthContext = createContext<GP51AuthContextType | undefined>(undefined);

export function GP51AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLevel, setAuthLevel] = useState<AuthenticationLevel>('full');
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN') {
          toast({
            title: "Welcome!",
            description: "Successfully signed in to GP51 Fleet Management.",
          });
        } else if (event === 'SIGNED_OUT') {
          toast({
            title: "Goodbye!",
            description: "Successfully signed out.",
          });
          setAuthLevel('full');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  const signIn = async (username: string, password: string) => {
    try {
      setLoading(true);
      
      const result = await gp51FallbackAuth.authenticateWithFallback(username, password);
      
      if (result.success) {
        setAuthLevel(result.level);
        
        // Show appropriate message based on authentication level
        const levelMessages = {
          full: "Connected to GP51 with full access",
          degraded: "Connected using cached GP51 data",
          minimal: "Connected with local authentication",
          offline: "Operating in offline mode"
        };
        
        toast({
          title: "Authentication Successful",
          description: levelMessages[result.level],
          variant: result.level === 'offline' ? 'destructive' : 'default'
        });
        
        return { error: null };
      } else {
        return { error: { message: result.error } };
      }
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Clear offline session if exists
      if (user) {
        const username = user.user_metadata?.gp51_username || 
                        user.email?.split('@')[0] || '';
        gp51FallbackAuth.clearOfflineSession(username);
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      
      setAuthLevel('full');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const retryConnection = async () => {
    if (!user) return;
    
    try {
      const isHealthy = await gp51FallbackAuth.checkGP51Health();
      if (isHealthy && authLevel !== 'full') {
        setAuthLevel('full');
        toast({
          title: "Connection Restored",
          description: "GP51 connection has been restored. Full features are now available.",
        });
      }
    } catch (error) {
      console.error('Connection retry failed:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    authLevel,
    signIn,
    signOut,
    retryConnection,
  };

  return (
    <GP51AuthContext.Provider value={value}>
      {children}
    </GP51AuthContext.Provider>
  );
}

export function useGP51Auth() {
  const context = useContext(GP51AuthContext);
  if (context === undefined) {
    throw new Error('useGP51Auth must be used within a GP51AuthProvider');
  }
  return context;
}
