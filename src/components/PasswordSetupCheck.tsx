
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PasswordSetupCheck: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkPasswordSetup = async () => {
      if (!user) return;

      try {
        const { data: envioUser, error } = await supabase
          .from('envio_users')
          .select('is_gp51_imported, needs_password_set, gp51_username')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error checking user status:', error);
          return;
        }

        if (envioUser?.is_gp51_imported && envioUser?.needs_password_set) {
          toast({
            title: "Password Setup Required",
            description: "You need to set your password to continue using the system.",
            duration: 5000
          });
          navigate('/set-password');
        }
      } catch (error) {
        console.error('Failed to check password setup status:', error);
      }
    };

    checkPasswordSetup();
  }, [user, navigate, toast]);

  return <>{children}</>;
};

export default PasswordSetupCheck;
