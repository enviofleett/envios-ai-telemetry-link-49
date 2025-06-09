
import React from 'react';
import EnhancedLoginForm from '@/components/auth/EnhancedLoginForm';
import ProfessionalAuthLayout from '@/components/auth/ProfessionalAuthLayout';

const Login: React.FC = () => {
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
