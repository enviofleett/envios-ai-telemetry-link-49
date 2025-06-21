
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, CheckCircle, WifiOff, AlertCircle } from 'lucide-react';
import OptimizedLoginForm from './OptimizedLoginForm';
import GP51CredentialSetup from '@/components/admin/GP51CredentialSetup';
import AdminSetupToggle from './AdminSetupToggle';
import AdminLoginInstructions from './AdminLoginInstructions';
import { supabase } from '@/integrations/supabase/client';

const EnhancedLoginPage: React.FC = () => {
  const [showAdminSetup, setShowAdminSetup] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [checkingCredentials, setCheckingCredentials] = useState(true);

  useEffect(() => {
    checkAdminCredentials();
  }, []);

  const checkAdminCredentials = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('gp51-connection-check');
      
      if (!error && data?.success) {
        setHasCredentials(true);
      } else {
        setHasCredentials(false);
      }
    } catch (error) {
      console.error('Error checking credentials:', error);
      setHasCredentials(false);
    } finally {
      setCheckingCredentials(false);
    }
  };

  const handleCredentialsStored = () => {
    setHasCredentials(true);
    setShowAdminSetup(false);
    checkAdminCredentials();
  };

  const getCredentialStatusBadge = () => {
    if (checkingCredentials) {
      return (
        <Badge variant="secondary">
          <AlertCircle className="h-3 w-3 mr-1" />
          Checking...
        </Badge>
      );
    }

    if (hasCredentials) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Configured
        </Badge>
      );
    }

    return (
      <Badge variant="destructive">
        <WifiOff className="h-3 w-3 mr-1" />
        Not Configured
      </Badge>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="w-full max-w-4xl">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-500 to-teal-500 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                FleetIQ Admin Portal
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Secure access to GP51 telemetry and fleet management
              </CardDescription>
            </div>
            
            {/* Admin Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Admin GP51 Status:</span>
              {getCredentialStatusBadge()}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <AdminSetupToggle 
              showAdminSetup={showAdminSetup}
              onToggle={() => setShowAdminSetup(!showAdminSetup)}
            />

            {showAdminSetup ? (
              <div className="space-y-4">
                <AdminLoginInstructions hasCredentials={hasCredentials} />
                <GP51CredentialSetup 
                  compact={true}
                  onCredentialsStored={handleCredentialsStored}
                />
                <div className="text-xs text-center text-gray-500 mt-4">
                  After configuring credentials, toggle back to "Regular Login" to access the system
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {hasCredentials && (
                  <AdminLoginInstructions hasCredentials={hasCredentials} />
                )}
                <OptimizedLoginForm />
                {!hasCredentials && (
                  <div className="text-xs text-center text-gray-500">
                    Need to set up admin access? Use the "Admin Setup" option above
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedLoginPage;
