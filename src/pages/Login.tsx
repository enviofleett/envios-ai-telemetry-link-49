
import React from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import ProfessionalLoginPage from '@/components/auth/ProfessionalLoginPage';

const Login: React.FC = () => {
  return (
    <ErrorBoundary>
      <ProfessionalLoginPage />
    </ErrorBoundary>
  );
};

export default Login;
