
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { WorkshopUser, WorkshopSession, WorkshopLoginData } from '@/types/workshop-auth';

// Define allowed roles array
const ALLOWED_ROLES = ['owner', 'manager', 'technician', 'inspector'] as const;
type WorkshopRole = typeof ALLOWED_ROLES[number];

// Type guard: does the value match one of the allowed roles?
function isWorkshopRole(role: string): role is WorkshopRole {
  return (ALLOWED_ROLES as readonly string[]).includes(role);
}

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
            // Strict typing: cast to WorkshopRole only if valid, else fallback
            const validRole = isWorkshopRole(userRecord.role) ? userRecord.role : 'technician';
            setWorkshopSession(sessionRecord);
            setWorkshopUser({
              ...userRecord,
              role: validRole,
              permissions: userRecord.permissions || [],
              is_active: userRecord.is_active ?? true,
              created_at: userRecord.created_at || new Date().toISOString(),
              updated_at: userRecord.updated_at || new Date().toISOString()
            });
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
    mutationFn: async (loginData: WorkshopLoginData) => {
      const { WorkshopAuthService } = await import('@/services/workshop/WorkshopAuthService');
      const result = await WorkshopAuthService.authenticateWorkshopUser(
        loginData.email,
        loginData.password,
        loginData.workshop_id as string
      );
      if (!result.success) throw new Error(result.error || 'Invalid credentials');
      
      // Create session in DB
      const { data: session, error: sessionError } = await supabase
        .from('workshop_sessions')
        .insert({
          workshop_user_id: result.user!.id,
          workshop_id: result.user!.workshop_id,
          expires_at: result.session!.expires_at,
          is_active: true
        })
        .select()
        .maybeSingle();
      if (sessionError || !session) throw new Error('Failed to create session');

      // Strict typing: cast to WorkshopRole only if valid, else fallback
      const validRole = isWorkshopRole(result.user!.role) ? result.user!.role : 'technician';
      return {
        user: {
          ...result.user!,
          role: validRole,
          permissions: [],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
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

      const { data, error } = await supabase
        .from('workshop_users')
        .select('*')
        .eq('workshop_id', workshopUser.workshop_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Enforce strict roles in all user objects
      return (data as WorkshopUser[]).map(user => ({
        ...user,
        role: isWorkshopRole(user.role) ? user.role : 'technician',
        permissions: user.permissions || [],
        is_active: user.is_active ?? true,
        created_at: user.created_at || new Date().toISOString(),
        updated_at: user.updated_at || new Date().toISOString()
      }));
    },
    enabled: !!workshopUser?.workshop_id
  });

  // Typesafe version of login()
  const login = (loginData: WorkshopLoginData) => {
    loginMutation.mutate(loginData);
  };

  return {
    workshopUser,
    workshopSession,
    workshopUsers,
    isLoading,
    login,
    logout,
    isLoggingIn: loginMutation.isPending
  };
};
