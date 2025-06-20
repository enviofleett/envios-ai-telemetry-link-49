
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireAgent?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  requireAgent = false
}) => {
  const { user, loading } = useUnifiedAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // For now, allow all authenticated users since UnifiedAuth doesn't have role checking yet
  // TODO: Add proper role checking when UnifiedAuth supports it
  if (requireAdmin || requireAgent) {
    // Temporarily allow all authenticated users
    console.log('Role checking not yet implemented in UnifiedAuth');
  }

  // User is authenticated and has required permissions
  return <>{children}</>;
};

export default ProtectedRoute;
