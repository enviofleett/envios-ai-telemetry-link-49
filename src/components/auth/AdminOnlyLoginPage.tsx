
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Settings, User, CheckCircle, WifiOff, AlertCircle } from 'lucide-react';
import AdminOptimizedLoginForm from './AdminOptimizedLoginForm';
import AdminGP51CredentialSetup from './AdminGP51CredentialSetup';
import { supabase } from '@/integrations/supabase/client';

const AdminOnlyLoginPage: React.FC = () => {
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
        // Auto-show setup if no credentials exist
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

  const getCredentialStatusBadge = () => {
    if (checkingCredentials) {
      return (
        <Badge variant="secondary" className="ml-2">
          <AlertCircle className="h-3 w-3 mr-1" />
          Checking...
        </Badge>
      );
    }

    if (hasCredentials) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 ml-2">
          <CheckCircle className="h-3 w-3 mr-1" />
          Ready
        </Badge>
      );
    }

    return (
      <Badge variant="destructive" className="ml-2">
        <WifiOff className="h-3 w-3 mr-1" />
        Setup Required
      </Badge>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="w-full max-w-lg">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-6 text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                EnvioFleet Admin Portal
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2 text-sm">
                System Administrator Access
              </CardDescription>
              <CardDescription className="text-xs text-gray-500 mt-1">
                Authorized for: chudesyl@gmail.com
              </CardDescription>
            </div>
            
            {/* Admin Status Dashboard */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 font-medium">GP51 Admin Account:</span>
                <div className="flex items-center">
                  <code className="bg-gray-200 px-2 py-1 rounded text-xs font-mono">octopus</code>
                  {getCredentialStatusBadge()}
                </div>
              </div>
              
              {hasCredentials && (
                <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
                  ✓ GP51 integration configured and ready for admin login
                </div>
              )}
              
              {!hasCredentials && !checkingCredentials && (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                  ⚠ GP51 credentials setup required before admin login
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-2">
            {/* Toggle Controls */}
            <div className="flex justify-center">
              <div className="bg-gray-100 rounded-lg p-1 flex">
                <Button
                  variant={!showCredentialSetup ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setShowCredentialSetup(false)}
                  className="flex items-center gap-2 text-sm px-4"
                  disabled={!hasCredentials}
                >
                  <User className="h-4 w-4" />
                  Admin Login
                </Button>
                <Button
                  variant={showCredentialSetup ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setShowCredentialSetup(true)}
                  className="flex items-center gap-2 text-sm px-4"
                >
                  <Settings className="h-4 w-4" />
                  GP51 Setup
                </Button>
              </div>
            </div>

            {/* Main Content Area */}
            {showCredentialSetup ? (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    GP51 Admin Configuration
                  </h3>
                  <p className="text-sm text-gray-600">
                    Configure GP51 credentials for the octopus admin account
                  </p>
                </div>
                <AdminGP51CredentialSetup 
                  onCredentialsStored={handleCredentialsStored}
                  compact={true}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Administrator Sign In
                  </h3>
                  <p className="text-sm text-gray-600">
                    Access the EnvioFleet management system
                  </p>
                </div>
                <AdminOptimizedLoginForm />
              </div>
            )}

            {/* Footer Info */}
            <div className="text-xs text-center text-gray-500 border-t pt-4 space-y-1">
              <div>EnvioFleet Intelligent Fleet Management</div>
              <div>Admin Portal v2.0 • Secure GP51 Integration</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOnlyLoginPage;
