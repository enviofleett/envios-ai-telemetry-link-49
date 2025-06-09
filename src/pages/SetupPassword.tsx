
import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PasswordSetupPage from '@/components/PasswordSetupPage';

export default function SetupPasswordRoute() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email") || "";
  const username = searchParams.get("username") || "";

  const handlePasswordSetupSuccess = () => {
    // Redirect to dashboard or main page
    navigate("/");
  };

  return (
    <PasswordSetupPage 
      username={username} 
      email={email}
      onPasswordSetupSuccess={handlePasswordSetupSuccess} 
    />
  );
}
