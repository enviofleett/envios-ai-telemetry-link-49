
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false, 
  fallback 
}) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return fallback || (
      <Alert>
        <AlertDescription>
          Please sign in to access this page.
        </AlertDescription>
      </Alert>
    );
  }

  if (requireAdmin && !isAdmin) {
    return fallback || (
      <Alert>
        <AlertDescription>
          Admin access required to view this page.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
