
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminGP51AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  username: string | null;
  sessionToken: string | null;
}

export const useAdminGP51Auth = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<AdminGP51AuthState>({
    isLoading: false,
    isAuthenticated: false,
    error: null,
    username: null,
    sessionToken: null
  });

  const isAdminUser = user?.email === 'chudesyl@gmail.com';

  const authenticateAdmin = async () => {
    if (!isAdminUser) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('🔐 Starting admin GP51 authentication for:', user.email);

      const { data, error } = await supabase.functions.invoke('admin-gp51-auth', {
        body: { 
          action: 'authenticate_admin',
          adminEmail: user.email 
        }
      });

      if (error) {
        console.error('❌ Admin GP51 auth service error:', error);
        throw new Error(`Service error: ${error.message}`);
      }

      if (data.success) {
        console.log('✅ Admin GP51 authentication successful');
        setState({
          isLoading: false,
          isAuthenticated: true,
          error: null,
          username: data.username,
          sessionToken: data.token
        });

        toast({
          title: "Admin Access Granted",
          description: "GP51 integration configured successfully"
        });
      } else {
        console.error('❌ Admin GP51 authentication failed:', data.error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: data.error || 'Authentication failed'
        }));
      }
    } catch (error) {
      console.error('❌ Admin authentication error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  };

  const resetAuth = () => {
    setState({
      isLoading: false,
      isAuthenticated: false,
      error: null,
      username: null,
      sessionToken: null
    });
  };

  // Auto-authenticate when admin user is detected
  useEffect(() => {
    if (isAdminUser && !state.isAuthenticated && !state.isLoading) {
      authenticateAdmin();
    }
  }, [isAdminUser, state.isAuthenticated, state.isLoading]);

  return {
    ...state,
    isAdminUser,
    authenticateAdmin,
    resetAuth
  };
};
