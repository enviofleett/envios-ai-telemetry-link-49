import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { WorkshopUser, WorkshopSession, WorkshopLoginData } from '@/types/workshop-auth';

export const useWorkshopAuth = () => {
  const [workshopUser, setWorkshopUser] = useState<WorkshopUser | null>(null);
  const [workshopSession, setWorkshopSession] = useState<WorkshopSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check for existing workshop session on mount
  useEffect(() => {
    checkWorkshopSession();
  }, []);

  const checkWorkshopSession = async () => {
    try {
      const sessionData = localStorage.getItem('workshop_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        // Use .maybeSingle() for safer fetches:
        const { data: sessionRecord, error: sessionError } = await supabase
          .from('workshop_sessions')
          .select('*')
          .eq('id', session.id)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (sessionRecord && !sessionError) {
          const { data: userRecord, error: userError } = await supabase
            .from('workshop_users')
            .select('*')
            .eq('id', sessionRecord.workshop_user_id)
            .maybeSingle();

          if (userRecord && !userError) {
            setWorkshopSession(sessionRecord);
            setWorkshopUser(userRecord);
          } else {
            localStorage.removeItem('workshop_session');
          }
        } else {
          localStorage.removeItem('workshop_session');
        }
      }
    } catch (error) {
      console.error('Session check failed:', error);
      localStorage.removeItem('workshop_session');
    } finally {
      setIsLoading(false);
    }
  };

  // Login mutation - USE SECURE SERVICE
  const loginMutation = useMutation({
    mutationFn: async (loginData) => {
      // Secure: call our new service function!
      const { WorkshopAuthService } = await import('@/services/workshop/WorkshopAuthService');
      const result = await WorkshopAuthService.authenticateWorkshopUser(
        loginData.email,
        loginData.password,
        loginData.workshop_id
      );
      if (!result.success) throw new Error(result.error || 'Invalid credentials');
      // Create session in DB
      const { data: session, error: sessionError } = await supabase
        .from('workshop_sessions')
        .insert({
          workshop_user_id: result.user.id,
          workshop_id: result.user.workshop_id,
          expires_at: result.session.expires_at,
          is_active: true
        })
        .select()
        .maybeSingle();
      if (sessionError || !session) throw new Error('Failed to create session');
      return {
        user: result.user,
        session
      };
    },
    onSuccess: (data) => {
      setWorkshopUser(data.user);
      setWorkshopSession(data.session);
      localStorage.setItem('workshop_session', JSON.stringify(data.session));
      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.user.name}!`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive"
      });
    }
  });

  // Logout function
  const logout = async () => {
    try {
      if (workshopSession) {
        await supabase
          .from('workshop_sessions')
          .update({ is_active: false })
          .eq('id', workshopSession.id);
      }
      
      setWorkshopUser(null);
      setWorkshopSession(null);
      localStorage.removeItem('workshop_session');
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out."
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Get workshop users (for admin)
  const { data: workshopUsers } = useQuery({
    queryKey: ['workshop-users', workshopUser?.workshop_id],
    queryFn: async () => {
      if (!workshopUser?.workshop_id) return [];
      
      // NEW: select envio_user_id as well
      const { data, error } = await supabase
        .from('workshop_users')
        .select('*, envio_user_id') // additional explicit select, just in case
        .eq('workshop_id', workshopUser.workshop_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WorkshopUser[];
    },
    enabled: !!workshopUser?.workshop_id
  });

  return {
    workshopUser,
    workshopSession,
    workshopUsers,
    isLoading,
    login: loginMutation.mutate,
    logout,
    isLoggingIn: loginMutation.isPending
  };
};
