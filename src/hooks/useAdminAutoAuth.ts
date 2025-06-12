
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
      console.log('🚨 ADMIN BYPASS: Auto-auth process initiated but bypass is active');
      
      setStatus(prev => ({
        ...prev,
        isAdmin: true,
        isAutoAuthenticating: true,
        error: null
      }));

      try {
        console.log('🔧 Attempting settings-management function call...');
        const startTime = Date.now();
        
        const { data, error } = await supabase.functions.invoke('settings-management', {
          body: { action: 'admin-auto-auth' }
        });

        const duration = Date.now() - startTime;
        console.log(`⏱️ Edge function call took ${duration}ms`);

        if (error) {
          console.error('❌ Edge function error:', error);
          throw new Error(error.message);
        }

        if (!data?.success) {
          console.error('❌ Edge function returned failure:', data);
          throw new Error(data?.error || 'Admin auto-authentication failed');
        }

        console.log('✅ Admin auto-authentication successful:', data);
        
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
        console.log('🚨 ADMIN BYPASS: Auto-auth failed but bypass ensures access');
        
        const errorMessage = error instanceof Error ? error.message : 'Auto-authentication failed';
        
        setStatus(prev => ({
          ...prev,
          isAutoAuthenticating: false,
          autoAuthCompleted: false,
          error: errorMessage
        }));

        // Show informational toast instead of error since bypass is active
        toast({
          title: "Admin Bypass Active",
          description: "Auto-authentication failed but admin access granted via bypass",
        });
      }
    };

    // Add slight delay to allow other systems to initialize
    const timeoutId = setTimeout(performAdminAutoAuth, 1000);
    return () => clearTimeout(timeoutId);
  }, [user, toast]);

  return status;
};
