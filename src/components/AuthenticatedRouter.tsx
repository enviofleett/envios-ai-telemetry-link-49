
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGP51SetupStatus } from '@/hooks/useGP51SetupStatus';

interface AuthenticatedRouterProps {
  children: React.ReactNode;
  requiresGP51?: boolean;
}

const AuthenticatedRouter: React.FC<AuthenticatedRouterProps> = ({ 
  children, 
  requiresGP51 = true 
}) => {
  const { user, loading: authLoading } = useAuth();
  const { hasGP51Configured, isLoading: gp51Loading } = useGP51SetupStatus();

  // Show loading while checking authentication states
  if (authLoading || (user && requiresGP51 && gp51Loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if user is not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If GP51 is required but not configured, redirect to setup
  if (requiresGP51 && !hasGP51Configured) {
    return <Navigate to="/settings/gp51-setup" replace />;
  }

  // Render children if all authentication requirements are met
  return <>{children}</>;
};

export default AuthenticatedRouter;
