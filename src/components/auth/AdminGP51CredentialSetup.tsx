
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Key, Save, TestTube, CheckCircle, AlertCircle, Info, Shield } from 'lucide-react';

interface AdminGP51CredentialSetupProps {
  onCredentialsStored?: () => void;
  compact?: boolean;
}

const AdminGP51CredentialSetup: React.FC<AdminGP51CredentialSetupProps> = ({ 
  onCredentialsStored,
  compact = false 
}) => {
  const [password, setPassword] = useState('');
  const [isStoring, setIsStoring] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [lastStoredHash, setLastStoredHash] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
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
    setDebugInfo(null);
    
    try {
      console.log('🔑 [ADMIN-SETUP] Storing octopus admin credentials...');

      const { data, error } = await supabase.functions.invoke('store-admin-credentials', {
        body: {
          username: 'octopus',
          password: password
        }
      });

      if (error) {
        console.error('❌ [ADMIN-SETUP] Edge Function error:', error);
        throw new Error(error.message || 'Failed to store admin credentials');
      }

      if (!data?.success) {
        console.error('❌ [ADMIN-SETUP] Credential storage failed:', data?.error);
        
        if (data?.debugInfo) {
          setDebugInfo(data.debugInfo);
        }
        
        let errorMessage = data?.error || 'Failed to store admin credentials';
        if (data?.gp51Status === 'EMPTY_RESPONSE') {
          errorMessage = 'GP51 API returned empty response. Please verify the octopus account password.';
        } else if (data?.gp51Status === 'INVALID_JSON') {
          errorMessage = 'GP51 API returned invalid response. Please check GP51 service status.';
        }
        
        throw new Error(errorMessage);
      }

      console.log('✅ [ADMIN-SETUP] Admin credentials stored successfully');

      if (data.details?.hashPreview) {
        setLastStoredHash(data.details.hashPreview);
      }

      toast({
        title: "Admin Setup Complete",
        description: `GP51 octopus account configured successfully. Hash: ${data.details?.hashPreview || 'generated'}`
      });

      setPassword('');
      setDebugInfo(null);
      
      if (onCredentialsStored) {
        onCredentialsStored();
      }
    } catch (error) {
      console.error('❌ [ADMIN-SETUP] Error storing admin credentials:', error);
      toast({
        title: "Admin Setup Failed",
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
          title: "Admin Connection Verified",
          description: `GP51 octopus account is properly configured and accessible`
        });
      } else {
        toast({
          title: "Admin Connection Test Failed",
          description: data.error || "Unable to verify octopus account connection",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Admin connection test error:', error);
      toast({
        title: "Connection Test Error",
        description: error instanceof Error ? error.message : "Test failed",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const content = (
    <>
      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Admin Configuration:</strong> Configure GP51 credentials for the octopus administrative account. 
          Password will be MD5 hashed, validated with GP51 API, and securely stored for admin access.
        </AlertDescription>
      </Alert>

      {lastStoredHash && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ✅ Admin credentials configured! Password hash: <code className="bg-green-100 px-1 rounded">{lastStoredHash}</code>
          </AlertDescription>
        </Alert>
      )}

      {debugInfo && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Debug Information:</strong>
            <ul className="text-xs mt-2 space-y-1">
              <li>API URL: {debugInfo.apiUrl}</li>
              <li>Response Length: {debugInfo.responseLength}</li>
              <li>Hash Preview: {debugInfo.hashedPasswordPreview}</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="admin-username">Admin Username</Label>
        <Input
          id="admin-username"
          value="octopus"
          disabled
          className="bg-gray-50 font-mono"
        />
        <p className="text-xs text-gray-600">
          Fixed GP51 administrative account
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="admin-password">GP51 Password</Label>
        <Input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter GP51 password for octopus account"
        />
        <p className="text-xs text-gray-600">
          Password will be MD5 hashed and validated with GP51 before storage
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={storeCredentials}
          disabled={isStoring || !password.trim()}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {isStoring ? 'Configuring Admin...' : 'Configure Admin Access'}
        </Button>

        <Button
          variant="outline"
          onClick={testConnection}
          disabled={isTesting}
          className="border-blue-300 text-blue-700 hover:bg-blue-50"
        >
          <TestTube className="h-4 w-4 mr-2" />
          {isTesting ? 'Testing...' : 'Test'}
        </Button>
      </div>

      <div className="text-xs text-gray-500 space-y-1 bg-gray-50 rounded p-3">
        <div className="font-medium text-gray-700">Admin Setup Process:</div>
        <p>• Validates credentials with GP51 octopus account</p>
        <p>• MD5 hashes password for GP51 compatibility</p>
        <p>• Stores credentials securely for admin authentication</p>
        <p>• Links to chudesyl@gmail.com Supabase account</p>
      </div>
    </>
  );

  if (compact) {
    return (
      <div className="space-y-4">
        {content}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6 border rounded-lg bg-white">
      <div className="flex items-center gap-2 mb-4">
        <Key className="h-5 w-5 text-blue-600" />
        <span className="font-semibold text-gray-800">GP51 Admin Configuration</span>
      </div>
      {content}
    </div>
  );
};

export default AdminGP51CredentialSetup;
