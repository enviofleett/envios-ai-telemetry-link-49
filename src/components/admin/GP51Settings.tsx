
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedGP51Service } from '@/hooks/useUnifiedGP51Service';
import { GP51_BASE_URL } from '@/services/gp51/urlHelpers';

export default function GP51Settings() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    apiUrl: GP51_BASE_URL
  });
  
  const {
    session,
    isConnected,
    isLoading,
    error,
    authenticate,
    clearError
  } = useUnifiedGP51Service();

  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear any existing errors when user starts typing
    if (error) {
      clearError();
    }
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

    const success = await authenticate({
      username: credentials.username,
      password: credentials.password,
      apiUrl: credentials.apiUrl
    });

    if (success) {
      // Clear form after successful authentication
      setCredentials({
        username: '',
        password: '',
        apiUrl: GP51_BASE_URL
      });
    }
  };

  const getConnectionStatusBadge = () => {
    if (isLoading) {
      return <Badge variant="outline">Connecting...</Badge>;
    }
    
    if (isConnected && session) {
      const isExpiringSoon = new Date(session.expiresAt).getTime() - Date.now() < 2 * 60 * 60 * 1000; // 2 hours
      
      if (isExpiringSoon) {
        return <Badge variant="outline">Expires Soon</Badge>;
      }
      
      return <Badge variant="default">Connected</Badge>;
    }
    
    return <Badge variant="destructive">Disconnected</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>GP51 Integration Settings</CardTitle>
          {getConnectionStatusBadge()}
        </div>
        {session && (
          <p className="text-sm text-muted-foreground">
            Connected as: {session.username} | Expires: {new Date(session.expiresAt).toLocaleString()}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-800 rounded-md text-sm">
            <p className="font-medium">❌ Connection Error</p>
            <p>{error}</p>
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            name="username"
            type="text"
            value={credentials.username}
            onChange={handleChange}
            placeholder="GP51 Username"
            disabled={isLoading}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={credentials.password}
            onChange={handleChange}
            placeholder="GP51 Password"
            disabled={isLoading}
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
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            Base URL for GP51 API (webapi endpoint will be automatically appended)
          </p>
        </div>
        
        <div>
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Connecting..." : "Save & Test Credentials"}
          </Button>
        </div>

        {isConnected && (
          <div className="p-3 bg-green-50 text-green-800 rounded-md text-sm">
            <p className="font-medium">✅ Connection Successful</p>
            <p>GP51 credentials have been saved and tested successfully</p>
            <p>You can now use the Connection Testing tab to verify full functionality</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
