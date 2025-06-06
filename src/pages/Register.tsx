
import React from 'react';
import ProfessionalAuthLayout from '@/components/auth/ProfessionalAuthLayout';
import EnhancedRegistrationForm from '@/components/auth/EnhancedRegistrationForm';

const Register: React.FC = () => {
  return (
    <ProfessionalAuthLayout
      title="Create Your Account"
      subtitle="Join the FleetIQ GPS51 management platform"
    >
      <EnhancedRegistrationForm />
    </ProfessionalAuthLayout>
  );
};

export default Register;
