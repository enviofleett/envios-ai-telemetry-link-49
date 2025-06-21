
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Key, Save, TestTube, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { GP51_BASE_URL } from '@/services/gp51/urlHelpers';

interface GP51CredentialSetupProps {
  onCredentialsStored?: () => void;
  compact?: boolean;
}

const GP51CredentialSetup: React.FC<GP51CredentialSetupProps> = ({ 
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
        description: "Please enter the GP51 password",
        variant: "destructive"
      });
      return;
    }

    setIsStoring(true);
    setDebugInfo(null);
    
    try {
      console.log('🔑 [GP51-SETUP] Storing credentials via Edge Function...');

      // Call the enhanced Edge Function for credential storage
      const { data, error } = await supabase.functions.invoke('store-admin-credentials', {
        body: {
          username: 'octopus',
          password: password
        }
      });

      if (error) {
        console.error('❌ [GP51-SETUP] Edge Function error:', error);
        throw new Error(error.message || 'Failed to call credential storage function');
      }

      if (!data?.success) {
        console.error('❌ [GP51-SETUP] Storage failed:', data?.error);
        
        // Store debug info for troubleshooting
        if (data?.debugInfo) {
          setDebugInfo(data.debugInfo);
        }
        
        // Provide more specific error messages
        let errorMessage = data?.error || 'Failed to store credentials';
        if (data?.gp51Status === 'EMPTY_RESPONSE') {
          errorMessage = 'GP51 API returned empty response. This usually indicates an invalid API token or account access issue.';
        } else if (data?.gp51Status === 'INVALID_JSON') {
          errorMessage = 'GP51 API returned invalid response format. Please check GP51 service status.';
        }
        
        throw new Error(errorMessage);
      }

      console.log('✅ [GP51-SETUP] Credentials stored successfully');
      console.log('🔐 [GP51-SETUP] Hash details:', data.details);

      // Store the hash preview for display
      if (data.details?.hashPreview) {
        setLastStoredHash(data.details.hashPreview);
      }

      toast({
        title: "Success",
        description: `GP51 credentials stored and validated successfully. Password properly MD5 hashed: ${data.details?.hashPreview || 'hash generated'}`
      });

      setPassword('');
      setDebugInfo(null);
      
      // Callback for parent component
      if (onCredentialsStored) {
        onCredentialsStored();
      }
    } catch (error) {
      console.error('❌ [GP51-SETUP] Error storing credentials:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to store credentials",
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

      if (data.success) {
        toast({
          title: "Connection Test Successful",
          description: `Connected to GP51 for user: ${data.username}`
        });
      } else {
        toast({
          title: "Connection Test Failed",
          description: data.error || "Unknown error",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Connection test error:', error);
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
      <Alert>
        <AlertDescription>
          {compact 
            ? "Configure GP51 credentials for admin access. Password will be MD5 hashed and tested with GP51 API before storage."
            : "Store GP51 credentials for the octopus account. The password will be automatically MD5 hashed, tested with GP51 API, and stored securely if validation succeeds."
          }
        </AlertDescription>
      </Alert>

      {lastStoredHash && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ✅ Credentials stored successfully! Password hash: <code className="bg-green-100 px-1 rounded">{lastStoredHash}</code>
          </AlertDescription>
        </Alert>
      )}

      {debugInfo && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Debug Info:</strong>
            <ul className="text-xs mt-2 space-y-1">
              <li>API URL: {debugInfo.apiUrl}</li>
              <li>Response Length: {debugInfo.responseLength}</li>
              <li>Content-Length: {debugInfo.contentLength}</li>
              <li>Hash Preview: {debugInfo.hashedPasswordPreview}</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value="octopus"
          disabled
          className="bg-gray-50"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter GP51 password for octopus account"
        />
        <p className="text-xs text-gray-600">
          Password will be MD5 hashed and tested with GP51 API before storage
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={storeCredentials}
          disabled={isStoring || !password.trim()}
          className="flex-1"
        >
          <Save className="h-4 w-4 mr-2" />
          {isStoring ? 'Storing & Testing...' : 'Store & Test Credentials'}
        </Button>

        <Button
          variant="outline"
          onClick={testConnection}
          disabled={isTesting}
        >
          <TestTube className="h-4 w-4 mr-2" />
          {isTesting ? 'Testing...' : 'Test'}
        </Button>
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p>• Credentials are tested with GP51 API before storage</p>
        <p>• Password is MD5 hashed for GP51 compatibility</p>
        <p>• Uses {GP51_BASE_URL} API endpoint</p>
        <p>• Enhanced error reporting for troubleshooting</p>
      </div>
    </>
  );

  if (compact) {
    return (
      <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <Key className="h-4 w-4 text-gray-600" />
          <span className="font-medium text-gray-800">GP51 Admin Setup</span>
        </div>
        {content}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          GP51 Credential Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {content}
      </CardContent>
    </Card>
  );
};

export default GP51CredentialSetup;
