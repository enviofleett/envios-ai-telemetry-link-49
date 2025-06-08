
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useGP51Auth } from '@/contexts/GP51AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConnectionStatusBanner from '@/components/auth/ConnectionStatusBanner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false
}) => {
  const { user, loading, authLevel, retryConnection } = useGP51Auth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <>
      <ConnectionStatusBanner 
        currentLevel={authLevel} 
        onRetryConnection={retryConnection}
      />
      {children}
    </>
  );
};

export default ProtectedRoute;
