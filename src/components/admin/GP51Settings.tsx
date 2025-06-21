
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Switch } from "@/components/ui/switch"
import { supabase } from '@/integrations/supabase/client';
import { GP51SessionManager } from '@/services/gp51/sessionManager';

export default function GP51Settings() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    apiUrl: 'https://www.gps51.com' // Updated to use standardized base URL
  });
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    username?: string;
    error?: string;
    lastCheck?: Date;
  } | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    const fetchStatus = async () => {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'get-gp51-status' }
      });

      if (error) {
        console.error('Failed to fetch GP51 status:', error);
        return;
      }

      setConnectionStatus({
        connected: data.connected || false,
        username: data.username,
        error: data.error,
        lastCheck: new Date()
      });
    };

    fetchStatus();
  }, []);

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
      // Clear existing sessions first
      await GP51SessionManager.clearAllSessions();
      
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: {
          action: 'save-gp51-credentials',
          username: credentials.username,
          password: credentials.password,
          apiUrl: credentials.apiUrl
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Settings Saved",
          description: "GP51 credentials have been saved and tested successfully",
        });
        
        setConnectionStatus({
          connected: true,
          username: credentials.username,
          lastCheck: new Date()
        });
        
        // Clear form after successful save
        setCredentials({
          username: '',
          password: '',
          apiUrl: 'https://www.gps51.com' // Reset to standardized base URL
        });
      } else {
        throw new Error(data.error || 'Failed to save credentials');
      }
    } catch (error) {
      console.error('Failed to save GP51 credentials:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
      
      setConnectionStatus({
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        lastCheck: new Date()
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>GP51 Integration Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={credentials.password}
            onChange={handleChange}
            placeholder="GP51 Password"
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
        <div>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Credentials"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
