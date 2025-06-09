
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import EnhancedLoginForm from '@/components/auth/EnhancedLoginForm';
import ProfessionalAuthLayout from '@/components/auth/ProfessionalAuthLayout';

const Login: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Get the intended destination from navigation state
  const from = location.state?.from?.pathname || '/';

  // Redirect authenticated users to their intended destination
  if (!loading && user) {
    return <Navigate to={from} replace />;
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <ProfessionalAuthLayout
      title="Welcome Back"
      subtitle="Sign in to your FleetIQ account"
    >
      <EnhancedLoginForm />
    </ProfessionalAuthLayout>
  );
};

export default Login;
