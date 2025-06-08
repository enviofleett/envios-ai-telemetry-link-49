
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGP51Auth } from '@/contexts/GP51AuthContext';
import GP51LoginForm from '@/components/auth/GP51LoginForm';
import ConnectionStatusBanner from '@/components/auth/ConnectionStatusBanner';
import { AuthenticationLevel } from '@/services/auth/GP51FallbackAuthService';

const GP51Auth = () => {
  const { user, authLevel, retryConnection } = useGP51Auth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleLoginSuccess = (level: AuthenticationLevel) => {
    navigate('/');
  };

  const handleLoginError = (error: string) => {
    console.error('Login error:', error);
  };

  if (user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <ConnectionStatusBanner 
          currentLevel={authLevel} 
          onRetryConnection={retryConnection}
        />
        
        <GP51LoginForm
          onSuccess={handleLoginSuccess}
          onError={handleLoginError}
        />
      </div>
    </div>
  );
};

export default GP51Auth;
