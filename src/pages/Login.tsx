
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

const Login: React.FC = () => {
  const { user } = useUnifiedAuth();

  // Redirect to auth page for unified authentication
  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to="/auth" replace />;
};

export default Login;
