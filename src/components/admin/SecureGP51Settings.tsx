
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Shield, CheckCircle, AlertTriangle, Lock } from 'lucide-react';
import { secureGP51AuthService } from '@/services/gp51/SecureGP51AuthService';

export default function SecureGP51Settings() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    apiUrl: 'https://www.gps51.com' // Updated to use standardized base URL
  });
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<{
    isAuthenticated: boolean;
    username?: string;
    lastValidated?: Date;
  } | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const status = await secureGP51AuthService.getAuthStatus();
      setAuthStatus(status);
    } catch (error) {
      console.error('Failed to check auth status:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!credentials.username || !credentials.password) {
      toast({
        title: "Validation Error",
        description: "Username and password are required",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await secureGP51AuthService.authenticate(
        credentials.username,
        credentials.password,
        credentials.apiUrl
      );

      if (result.success) {
        toast({
          title: "Secure Authentication Successful",
          description: "GP51 credentials have been securely stored and validated",
        });
        
        await checkAuthStatus();
        
        // Clear form after successful save
        setCredentials({
          username: '',
          password: '',
          apiUrl: 'https://www.gps51.com' // Reset to standardized base URL
        });
      } else {
        throw new Error(result.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Failed to save GP51 credentials:', error);
      toast({
        title: "Authentication Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await secureGP51AuthService.logout();
      await checkAuthStatus();
      toast({
        title: "Logged Out",
        description: "GP51 credentials have been deactivated",
      });
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        title: "Logout Failed",
        description: "Failed to logout from GP51",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const result = await secureGP51AuthService.getAuthStatus();
      if (result.isAuthenticated) {
        toast({
          title: "Connection Active",
          description: `Connected as ${result.username}`,
        });
      } else {
        toast({
          title: "No Active Connection",
          description: "Please authenticate first",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Connection Test Failed",
        description: "Failed to test GP51 connection",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Secure GP51 Integration
        </CardTitle>
        <div className="text-sm text-gray-600">
          <p>✅ Vault-based credential encryption</p>
          <p>✅ Comprehensive audit logging</p>
          <p>✅ Secure session management</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Authentication Status */}
        {authStatus && (
          <div className={`p-4 rounded-lg border ${
            authStatus.isAuthenticated 
              ? 'bg-green-50 border-green-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {authStatus.isAuthenticated ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-gray-500" />
              )}
              <span className="font-medium">
                {authStatus.isAuthenticated ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            {authStatus.isAuthenticated && (
              <div className="text-sm text-gray-600">
                <p>Username: {authStatus.username}</p>
                {authStatus.lastValidated && (
                  <p>Last validated: {authStatus.lastValidated.toLocaleString()}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Credential Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              value={credentials.username}
              onChange={handleChange}
              placeholder="GP51 Username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              Password
              <Lock className="h-4 w-4 text-gray-500" />
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="GP51 Password (encrypted in vault)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiUrl">API Base URL</Label>
            <Input
              id="apiUrl"
              name="apiUrl"
              type="text"
              value={credentials.apiUrl}
              onChange={handleChange}
              placeholder="GP51 API Base URL"
            />
            <p className="text-xs text-muted-foreground">
              Base URL for GP51 API (webapi endpoint will be automatically appended)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Processing..." : "Save & Authenticate"}
          </Button>
          
          {authStatus?.isAuthenticated && (
            <>
              <Button variant="outline" onClick={testConnection} disabled={isLoading}>
                Test Connection
              </Button>
              <Button variant="destructive" onClick={handleLogout} disabled={isLoading}>
                Logout
              </Button>
            </>
          )}
        </div>

        {/* Security Notice */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <strong>Security:</strong> Passwords are encrypted using Supabase Vault. 
              All authentication attempts are logged for audit purposes. The system uses 
              standardized GP51 base URL with automatic webapi endpoint appending.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
