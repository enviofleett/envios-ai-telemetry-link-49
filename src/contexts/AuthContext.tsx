import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PackageMappingService } from '@/services/packageMappingService';
import { enhancedGP51SessionManager } from '@/services/gp51/enhancedGP51SessionManager';

interface AuthContextType {
  user: any | null;
  userRole: string | null;
  isAdmin: boolean;
  loading: boolean;
  gp51Connected: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string, packageId?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
  connectGP51: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  disconnectGP51: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  isAdmin: false,
  loading: true,
  gp51Connected: false,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  refreshUserRole: async () => {},
  connectGP51: async () => ({ success: false }),
  disconnectGP51: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [gp51Connected, setGp51Connected] = useState(false);

  const fetchUserRole = async (authUserId: string) => {
    try {
      console.log('Fetching role for auth user ID:', authUserId);
      
      const { data: roleData, error: roleError } = await supabase
        .rpc('get_user_role', { _user_id: authUserId });

      if (!roleError && roleData) {
        console.log('Role fetched successfully:', roleData);
        setUserRole(roleData);
        return;
      }

      console.log('No role found or error:', roleError);
      
      if (authUserId) {
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser.user) {
          const { data: envioUser, error: envioError } = await supabase
            .from('envio_users')
            .select('id')
            .eq('id', authUserId)
            .single();
          
          if (envioError && envioError.code === 'PGRST116') {
            console.log('Creating envio_users record for auth user:', authUserId);
            await supabase
              .from('envio_users')
              .insert({
                id: authUserId,
                name: authUser.user.email?.split('@')[0] || 'User',
                email: authUser.user.email || ''
              });
          }

          const { data: existingRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', authUserId)
            .single();

          if (!existingRole) {
            console.log('Creating default user role for auth user:', authUserId);
            await supabase
              .from('user_roles')
              .insert({
                user_id: authUserId,
                role: 'user' as any
              });
          }

          setUserRole(existingRole?.role || 'user');
        }
      }
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
      setUserRole('user');
    }
  };

  const checkGP51Connection = async () => {
    if (user) {
      const isValid = enhancedGP51SessionManager.isSessionValid();
      if (!isValid) {
        const restored = await enhancedGP51SessionManager.restoreSession();
        setGp51Connected(restored);
      } else {
        setGp51Connected(true);
      }
    } else {
      setGp51Connected(false);
    }
  };

  const refreshUserRole = async () => {
    if (user) {
      await fetchUserRole(user.id);
    }
  };

  const connectGP51 = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const result = await enhancedGP51SessionManager.authenticateAndPersist(username, password);
    if (result.success) {
      setGp51Connected(true);
    }
    return result;
  };

  const disconnectGP51 = async (): Promise<void> => {
    await enhancedGP51SessionManager.clearSession();
    setGp51Connected(false);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
            checkGP51Connection();
          }, 0);
        } else {
          setUserRole(null);
          setGp51Connected(false);
        }
        
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.id);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
        checkGP51Connection();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user && !loading) {
      refreshUserRole();
      checkGP51Connection();
    }
  }, [user, loading]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, name: string, packageId: string = 'basic') => {
    const redirectUrl = `${window.location.origin}/`;
    
    const packageValidation = PackageMappingService.validatePackage(packageId);
    if (!packageValidation.isValid) {
      return { error: { message: packageValidation.error } };
    }

    const gp51UserType = PackageMappingService.getGP51UserType(packageId);
    const envioRole = PackageMappingService.getEnvioRole(packageId);
    const requiresApproval = PackageMappingService.requiresApproval(packageId);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    if (!error && data.user) {
      try {
        console.log('Creating envio_users record for new user with package:', packageId);
        await supabase
          .from('envio_users')
          .insert({
            id: data.user.id,
            name,
            email,
            gp51_user_type: gp51UserType,
            registration_status: requiresApproval ? 'pending_approval' : 'approved',
            registration_type: 'package_registration'
          });

        const finalRole = requiresApproval ? 'user' : envioRole;
        await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role: finalRole as any
          });

        try {
          const { data: existingPackages } = await supabase
            .from('subscriber_packages')
            .select('id, package_name')
            .eq('package_name', PackageMappingService.getPackageInfo(packageId)?.packageName);

          let packageDbId = null;
          if (existingPackages && existingPackages.length > 0) {
            packageDbId = existingPackages[0].id;
          }

          if (packageDbId) {
            await supabase
              .from('user_subscriptions' as any)
              .insert({
                user_id: data.user.id,
                package_id: packageDbId,
                subscription_status: 'active',
                billing_cycle: 'monthly',
                start_date: new Date().toISOString(),
                discount_applied: 0
              });
          }
        } catch (subscriptionError) {
          console.error('Failed to create user subscription:', subscriptionError);
        }

        if (requiresApproval) {
          await supabase
            .from('admin_role_requests' as any)
            .insert({
              user_id: data.user.id,
              requested_role: 'admin',
              status: 'pending',
              request_reason: `${PackageMappingService.getPackageInfo(packageId)?.packageName} package registration requires approval`
            });
        }
      } catch (dbError) {
        console.error('Failed to create user records:', dbError);
      }
    }
    
    return { error };
  };

  const signOut = async () => {
    await enhancedGP51SessionManager.clearSession();
    await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
    setGp51Connected(false);
  };

  const value = {
    user,
    userRole,
    isAdmin: userRole === 'admin',
    loading,
    gp51Connected,
    signIn,
    signUp,
    signOut,
    refreshUserRole,
    connectGP51,
    disconnectGP51,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
