
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import ProfessionalAuthLayout from '@/components/auth/ProfessionalAuthLayout';
import EnhancedLoginForm from '@/components/auth/EnhancedLoginForm';

const Auth = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <ProfessionalAuthLayout
      title="Welcome Back"
      subtitle="Sign in to your FleetIQ GPS51 dashboard"
    >
      <EnhancedLoginForm />
    </ProfessionalAuthLayout>
  );
};

export default Auth;
