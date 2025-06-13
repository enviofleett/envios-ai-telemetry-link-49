
import React, { useState } from 'react';
import PublicRegistrationForm from '@/components/PublicRegistration/PublicRegistrationForm';
import OTPVerificationForm from '@/components/PublicRegistration/OTPVerificationForm';
import RegistrationSuccess from '@/components/PublicRegistration/RegistrationSuccess';

type RegistrationStep = 'form' | 'otp' | 'success';

const PublicRegistration: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('form');
  const [registrationData, setRegistrationData] = useState<{
    registrationId: string;
    otpId: string;
    phoneNumber: string;
  }>({
    registrationId: '',
    otpId: '',
    phoneNumber: ''
  });

  const handleRegistrationSuccess = (registrationId: string, otpId: string) => {
    // Get phone number from form data (you might want to pass this differently)
    const phoneNumber = ''; // This should be passed from the form
    setRegistrationData({ registrationId, otpId, phoneNumber });
    setCurrentStep('otp');
  };

  const handleOTPSuccess = () => {
    setCurrentStep('success');
  };

  const handleBackToForm = () => {
    setCurrentStep('form');
    setRegistrationData({ registrationId: '', otpId: '', phoneNumber: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {currentStep === 'form' && (
          <PublicRegistrationForm onSuccess={handleRegistrationSuccess} />
        )}
        
        {currentStep === 'otp' && (
          <OTPVerificationForm
            registrationId={registrationData.registrationId}
            otpId={registrationData.otpId}
            phoneNumber={registrationData.phoneNumber}
            onSuccess={handleOTPSuccess}
            onBack={handleBackToForm}
          />
        )}
        
        {currentStep === 'success' && <RegistrationSuccess />}
      </div>
    </div>
  );
};

export default PublicRegistration;
