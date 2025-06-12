
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'chudesyl@gmail.com';

interface AdminAutoAuthStatus {
  isAdmin: boolean;
  isAutoAuthenticating: boolean;
  autoAuthCompleted: boolean;
  error: string | null;
}

export const useAdminAutoAuth = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<AdminAutoAuthStatus>({
    isAdmin: false,
    isAutoAuthenticating: false,
    autoAuthCompleted: false,
    error: null
  });

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) {
      setStatus({
        isAdmin: false,
        isAutoAuthenticating: false,
        autoAuthCompleted: false,
        error: null
      });
      return;
    }

    const performAdminAutoAuth = async () => {
      console.log('🔑 Admin user detected, starting auto-authentication...');
      
      setStatus(prev => ({
        ...prev,
        isAdmin: true,
        isAutoAuthenticating: true,
        error: null
      }));

      try {
        const { data, error } = await supabase.functions.invoke('settings-management', {
          body: { action: 'admin-auto-auth' }
        });

        if (error) {
          throw new Error(error.message);
        }

        if (!data.success) {
          throw new Error(data.error || 'Admin auto-authentication failed');
        }

        console.log('✅ Admin auto-authentication successful');
        
        setStatus(prev => ({
          ...prev,
          isAutoAuthenticating: false,
          autoAuthCompleted: true,
          error: null
        }));

        toast({
          title: "Admin Access Granted",
          description: `Automatically authenticated with GP51 as ${data.username}`,
        });

      } catch (error) {
        console.error('❌ Admin auto-authentication failed:', error);
        
        const errorMessage = error instanceof Error ? error.message : 'Auto-authentication failed';
        
        setStatus(prev => ({
          ...prev,
          isAutoAuthenticating: false,
          autoAuthCompleted: false,
          error: errorMessage
        }));

        // Don't show error toast for admin - they can fall back to manual setup
        console.log('Admin can fall back to manual GP51 setup if needed');
      }
    };

    performAdminAutoAuth();
  }, [user, toast]);

  return status;
};
