
import React from 'react';
import { EnhancedLoginForm } from '@/components/auth/EnhancedLoginForm';
import { ProfessionalAuthLayout } from '@/components/auth/ProfessionalAuthLayout';

const Login: React.FC = () => {
  return (
    <ProfessionalAuthLayout>
      <EnhancedLoginForm />
    </ProfessionalAuthLayout>
  );
};

export default Login;
