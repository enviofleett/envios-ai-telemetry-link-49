
import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import OTPVerificationPage from '@/components/OTPVerificationPage';

export default function VerifyOTPRoute() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email") || "";
  const otpId = searchParams.get("otpId") || "";

  const handleVerificationSuccess = () => {
    // Redirect to password setup page
    navigate(`/setup-password?email=${encodeURIComponent(email)}`);
  };

  return (
    <OTPVerificationPage 
      email={email} 
      otpId={otpId}
      onVerificationSuccess={handleVerificationSuccess} 
    />
  );
}
