
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
        const session = JSON.parse(sessionData) as WorkshopSession;
        
        // Verify session is still valid
        const { data, error } = await supabase
          .from('workshop_sessions')
          .select(`
            *,
            workshop_users(*)
          `)
          .eq('id', session.id)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (data && !error) {
          setWorkshopSession(data);
          setWorkshopUser(data.workshop_users);
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

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (loginData: WorkshopLoginData) => {
      const { data, error } = await supabase.functions.invoke('workshop-auth', {
        body: {
          action: 'login',
          email: loginData.email,
          password: loginData.password,
          workshop_id: loginData.workshop_id
        }
      });

      if (error) throw error;
      return data;
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
      
      const { data, error } = await supabase
        .from('workshop_users')
        .select('*')
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
