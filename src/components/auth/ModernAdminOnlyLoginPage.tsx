
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { User, Settings, CheckCircle, WifiOff, AlertCircle } from 'lucide-react';
import ModernSplitScreenLoginLayout from './ModernSplitScreenLoginLayout';
import ModernAdminLoginForm from './ModernAdminLoginForm';
import ModernAdminCredentialSetup from './ModernAdminCredentialSetup';
import { supabase } from '@/integrations/supabase/client';

const ModernAdminOnlyLoginPage: React.FC = () => {
  const [showCredentialSetup, setShowCredentialSetup] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [checkingCredentials, setCheckingCredentials] = useState(true);

  useEffect(() => {
    checkAdminCredentials();
  }, []);

  const checkAdminCredentials = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('gp51-connection-check');
      
      if (!error && data?.success && data?.username === 'octopus') {
        setHasCredentials(true);
      } else {
        setHasCredentials(false);
        if (!data?.connected) {
          setShowCredentialSetup(true);
        }
      }
    } catch (error) {
      console.error('Error checking admin credentials:', error);
      setHasCredentials(false);
      setShowCredentialSetup(true);
    } finally {
      setCheckingCredentials(false);
    }
  };

  const handleCredentialsStored = () => {
    setHasCredentials(true);
    setShowCredentialSetup(false);
    checkAdminCredentials();
  };

  const getStatusIndicator = () => {
    if (checkingCredentials) {
      return (
        <div className="flex items-center space-x-2 text-gray-500">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Checking status...</span>
        </div>
      );
    }

    if (hasCredentials) {
      return (
        <div className="flex items-center space-x-2 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">GP51 Ready</span>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2 text-amber-600">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm font-medium">Setup Required</span>
      </div>
    );
  };

  return (
    <ModernSplitScreenLoginLayout>
      {/* Status Bar */}
      <div className="mb-6 flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl">
        <span className="text-sm text-gray-600">GP51 Status</span>
        {getStatusIndicator()}
      </div>

      {/* Toggle Controls */}
      <div className="mb-8 flex bg-gray-100 rounded-xl p-1">
        <Button
          variant={!showCredentialSetup ? "default" : "ghost"}
          size="sm"
          onClick={() => setShowCredentialSetup(false)}
          className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg"
          disabled={!hasCredentials}
        >
          <User className="h-4 w-4" />
          Login
        </Button>
        <Button
          variant={showCredentialSetup ? "default" : "ghost"}
          size="sm"
          onClick={() => setShowCredentialSetup(true)}
          className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg"
        >
          <Settings className="h-4 w-4" />
          Setup
        </Button>
      </div>

      {/* Main Content */}
      {showCredentialSetup ? (
        <ModernAdminCredentialSetup 
          onCredentialsStored={handleCredentialsStored}
          onBackToLogin={() => setShowCredentialSetup(false)}
        />
      ) : (
        <ModernAdminLoginForm />
      )}
    </ModernSplitScreenLoginLayout>
  );
};

export default ModernAdminOnlyLoginPage;
