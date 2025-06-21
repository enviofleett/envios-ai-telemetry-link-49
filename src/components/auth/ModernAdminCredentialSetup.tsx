
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Key, Save, TestTube, CheckCircle, AlertCircle, Settings, ArrowLeft } from 'lucide-react';

interface ModernAdminCredentialSetupProps {
  onCredentialsStored?: () => void;
  onBackToLogin?: () => void;
}

const ModernAdminCredentialSetup: React.FC<ModernAdminCredentialSetupProps> = ({ 
  onCredentialsStored,
  onBackToLogin 
}) => {
  const [password, setPassword] = useState('');
  const [isStoring, setIsStoring] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [lastStoredHash, setLastStoredHash] = useState<string | null>(null);
  const { toast } = useToast();

  const storeCredentials = async () => {
    if (!password.trim()) {
      toast({
        title: "Error",
        description: "Please enter the GP51 password for the octopus account",
        variant: "destructive"
      });
      return;
    }

    setIsStoring(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('store-admin-credentials', {
        body: {
          username: 'octopus',
          password: password
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to store admin credentials');
      }

      if (!data?.success) {
        let errorMessage = data?.error || 'Failed to store admin credentials';
        if (data?.gp51Status === 'EMPTY_RESPONSE') {
          errorMessage = 'GP51 API returned empty response. Please verify the octopus account password.';
        } else if (data?.gp51Status === 'INVALID_JSON') {
          errorMessage = 'GP51 API returned invalid response. Please check GP51 service status.';
        }
        
        throw new Error(errorMessage);
      }

      if (data.details?.hashPreview) {
        setLastStoredHash(data.details.hashPreview);
      }

      toast({
        title: "Setup Complete",
        description: `GP51 octopus account configured successfully`
      });

      setPassword('');
      
      if (onCredentialsStored) {
        onCredentialsStored();
      }
    } catch (error) {
      toast({
        title: "Setup Failed",
        description: error instanceof Error ? error.message : "Failed to configure admin credentials",
        variant: "destructive"
      });
    } finally {
      setIsStoring(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('gp51-connection-check');
      
      if (error) throw error;

      if (data.success && data.username === 'octopus') {
        toast({
          title: "Connection Verified",
          description: `GP51 octopus account is properly configured`
        });
      } else {
        toast({
          title: "Connection Test Failed",
          description: data.error || "Unable to verify octopus account connection",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Connection Test Error",
        description: error instanceof Error ? error.message : "Test failed",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-2xl mb-4">
          <Settings className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">GP51 Setup</h2>
        <p className="text-gray-600">Configure your admin credentials</p>
      </div>

      {/* Back Button */}
      {onBackToLogin && (
        <Button
          variant="ghost"
          onClick={onBackToLogin}
          className="mb-6 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Button>
      )}

      {/* Setup Info */}
      <Alert className="border-blue-200 bg-blue-50 mb-6 rounded-xl">
        <Key className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Configure GP51 credentials for the octopus administrative account. 
          Your password will be securely encrypted and validated.
        </AlertDescription>
      </Alert>

      {lastStoredHash && (
        <Alert className="border-green-200 bg-green-50 mb-6 rounded-xl">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ✅ Admin credentials configured successfully! 
            Hash: <code className="bg-green-100 px-1 rounded">{lastStoredHash}</code>
          </AlertDescription>
        </Alert>
      )}

      {/* Setup Form */}
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="admin-username" className="text-sm font-medium text-gray-900">
            Admin Username
          </Label>
          <Input
            id="admin-username"
            value="octopus"
            disabled
            className="bg-gray-50 border-gray-200 font-mono h-12 px-4 rounded-xl"
          />
          <p className="text-xs text-gray-600">
            Fixed GP51 administrative account
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-password" className="text-sm font-medium text-gray-900">
            GP51 Password
          </Label>
          <Input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter GP51 password for octopus account"
            className="h-12 px-4 rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500"
          />
          <p className="text-xs text-gray-600">
            Password will be encrypted and validated with GP51 before storage
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={storeCredentials}
            disabled={isStoring || !password.trim()}
            className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-xl"
          >
            <Save className="h-4 w-4 mr-2" />
            {isStoring ? 'Configuring...' : 'Configure Admin Access'}
          </Button>

          <Button
            variant="outline"
            onClick={testConnection}
            disabled={isTesting}
            className="border-purple-300 text-purple-700 hover:bg-purple-50 h-12 px-6 rounded-xl"
          >
            <TestTube className="h-4 w-4 mr-2" />
            {isTesting ? 'Testing...' : 'Test'}
          </Button>
        </div>

        {/* Setup Process Info */}
        <div className="text-xs text-gray-500 space-y-2 bg-gray-50 rounded-xl p-4">
          <div className="font-medium text-gray-700">Setup Process:</div>
          <div className="space-y-1">
            <p>• Validates credentials with GP51 octopus account</p>
            <p>• Encrypts password for secure storage</p>
            <p>• Links to your admin account for authentication</p>
            <p>• Enables quick login for future access</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernAdminCredentialSetup;
