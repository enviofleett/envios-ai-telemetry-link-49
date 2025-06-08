
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false
}) => {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute check:', { 
    user: user?.email || 'none', 
    loading, 
    path: location.pathname 
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    console.log('No user, redirecting to auth from:', location.pathname);
    return <Navigate to="/auth" replace />;
  }

  if (requireAdmin && !isAdmin) {
    console.log('User not admin, redirecting to dashboard');
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
