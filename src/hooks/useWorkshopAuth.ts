
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
        
        // Verify session is still valid using raw SQL query since we can't join with types
        const { data: sessionRecord, error: sessionError } = await supabase
          .from('workshop_sessions')
          .select('*')
          .eq('id', session.id)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (sessionRecord && !sessionError) {
          // Get the workshop user separately
          const { data: userRecord, error: userError } = await supabase
            .from('workshop_users')
            .select('*')
            .eq('id', sessionRecord.workshop_user_id)
            .single();

          if (userRecord && !userError) {
            setWorkshopSession(sessionRecord as WorkshopSession);
            setWorkshopUser(userRecord as WorkshopUser);
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

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (loginData: WorkshopLoginData) => {
      // For now, we'll implement a simple mock login
      // In production, this would call a Supabase Edge Function
      
      // Mock authentication - find user by email and workshop
      const { data: user, error } = await supabase
        .from('workshop_users')
        .select('*')
        .eq('email', loginData.email)
        .eq('workshop_id', loginData.workshop_id || '')
        .eq('is_active', true)
        .single();

      if (error || !user) {
        throw new Error('Invalid credentials');
      }

      // Create a session
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 8); // 8 hour session

      const { data: session, error: sessionError } = await supabase
        .from('workshop_sessions')
        .insert({
          workshop_user_id: user.id,
          workshop_id: user.workshop_id,
          expires_at: expiresAt.toISOString(),
          is_active: true
        })
        .select()
        .single();

      if (sessionError) {
        throw new Error('Failed to create session');
      }

      return {
        user: user as WorkshopUser,
        session: session as WorkshopSession
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
