
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

  console.log('🛡️ ProtectedRoute: Route check initiated');
  console.log('🛡️ ProtectedRoute: Current path:', location.pathname);
  console.log('🛡️ ProtectedRoute: User:', user?.email || 'none');
  console.log('🛡️ ProtectedRoute: Loading state:', loading);
  console.log('🛡️ ProtectedRoute: Admin required:', requireAdmin, 'Is admin:', isAdmin);

  if (loading) {
    console.log('⏳ ProtectedRoute: Still loading, showing spinner');
    return <LoadingSpinner />;
  }

  if (!user) {
    console.log('❌ ProtectedRoute: No user found, redirecting to /auth');
    console.log('📍 ProtectedRoute: Redirect from:', location.pathname, 'to: /auth');
    return <Navigate to="/auth" replace />;
  }

  if (requireAdmin && !isAdmin) {
    console.log('❌ ProtectedRoute: Admin required but user is not admin, redirecting to dashboard');
    console.log('📍 ProtectedRoute: Redirect from:', location.pathname, 'to: /');
    return <Navigate to="/" replace />;
  }

  console.log('✅ ProtectedRoute: Access granted to:', location.pathname);
  return <>{children}</>;
};

export default ProtectedRoute;
