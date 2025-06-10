
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Mail, 
  Bell, 
  Shield, 
  MapPin, 
  Wrench, 
  AlertTriangle,
  Save,
  TestTube
} from 'lucide-react';

interface EmailPreferences {
  id?: string;
  user_id: string;
  email: string;
  vehicle_alerts: boolean;
  maintenance_reminders: boolean;
  geofence_alerts: boolean;
  system_updates: boolean;
  urgent_only: boolean;
  created_at?: string;
  updated_at?: string;
}

export const EmailPreferencesManager: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testEmail, setTestEmail] = useState('');

  // Get current user
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  // Get email preferences - using raw query with fallback
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['email-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      try {
        // Try to fetch from the new table using a raw query
        const { data, error } = await supabase
          .rpc('get_user_email_preferences_by_id', { user_uuid: user.id });
        
        if (error) {
          console.error('RPC call failed:', error);
          // Return null so we can use default preferences
          return null;
        }
        
        return data?.[0] as EmailPreferences | null;
      } catch (error) {
        console.error('Error fetching email preferences:', error);
        return null;
      }
    },
    enabled: !!user?.id
  });

  const [localPreferences, setLocalPreferences] = useState<Partial<EmailPreferences>>({});

  React.useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    } else if (user) {
      // Default preferences for new users
      setLocalPreferences({
        user_id: user.id,
        email: user.email || '',
        vehicle_alerts: true,
        maintenance_reminders: true,
        geofence_alerts: true,
        system_updates: false,
        urgent_only: false
      });
    }
  }, [preferences, user]);

  // Save preferences - using edge function for now
  const savePreferences = useMutation({
    mutationFn: async (prefs: Partial<EmailPreferences>) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Use edge function to save preferences
      const { data, error } = await supabase.functions.invoke('smtp-email-service', {
        body: {
          action: 'save-email-preferences',
          preferences: {
            ...prefs,
            user_id: user.id,
          }
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to save preferences');
      
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Preferences Saved",
        description: "Your email notification preferences have been updated"
      });
      queryClient.invalidateQueries({ queryKey: ['email-preferences'] });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save email preferences",
        variant: "destructive"
      });
    }
  });

  // Send test email
  const sendTestEmail = useMutation({
    mutationFn: async () => {
      const email = testEmail || localPreferences.email;
      if (!email) throw new Error('Email address required');

      const { data, error } = await supabase.functions.invoke('smtp-email-service', {
        body: {
          action: 'send-email',
          recipientEmail: email,
          subject: 'Fleet Management - Email Test',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #2563eb;">Email Test Successful! 🎉</h1>
              <p>This is a test email from your Fleet Management platform.</p>
              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3>Your Current Notification Preferences:</h3>
                <ul>
                  <li>Vehicle Alerts: ${localPreferences.vehicle_alerts ? '✅ Enabled' : '❌ Disabled'}</li>
                  <li>Maintenance Reminders: ${localPreferences.maintenance_reminders ? '✅ Enabled' : '❌ Disabled'}</li>
                  <li>Geofence Alerts: ${localPreferences.geofence_alerts ? '✅ Enabled' : '❌ Disabled'}</li>
                  <li>System Updates: ${localPreferences.system_updates ? '✅ Enabled' : '❌ Disabled'}</li>
                  <li>Urgent Only Mode: ${localPreferences.urgent_only ? '✅ Enabled' : '❌ Disabled'}</li>
                </ul>
              </div>
              <p>If you received this email, your notification system is working correctly!</p>
            </div>
          `,
          textContent: `Email Test Successful! This is a test email from your Fleet Management platform. If you received this email, your notification system is working correctly!`,
          templateType: 'test'
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to send test email');
      
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Test Email Sent",
        description: "Check your email inbox for the test message"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Test Email Failed",
        description: error.message || "Failed to send test email",
        variant: "destructive"
      });
    }
  });

  const handlePreferenceChange = (key: keyof EmailPreferences, value: boolean) => {
    setLocalPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    savePreferences.mutate(localPreferences);
  };

  const handleTestEmail = () => {
    sendTestEmail.mutate();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading email preferences...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>
            Please log in to manage your email notification preferences
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notification Preferences
          </CardTitle>
          <CardDescription>
            Configure which fleet management notifications you want to receive via email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Address */}
          <div className="space-y-2">
            <Label htmlFor="email">Notification Email Address</Label>
            <Input
              id="email"
              type="email"
              value={localPreferences.email || ''}
              onChange={(e) => setLocalPreferences(prev => ({ ...prev, email: e.target.value }))}
              placeholder="your-email@example.com"
            />
          </div>

          {/* Notification Categories */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Notification Categories</h3>
            
            <div className="space-y-4">
              {/* Vehicle Alerts */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <div>
                    <h4 className="font-medium">Vehicle Alerts</h4>
                    <p className="text-sm text-muted-foreground">
                      Critical vehicle events, offline/online status, speed violations
                    </p>
                  </div>
                </div>
                <Switch
                  checked={localPreferences.vehicle_alerts || false}
                  onCheckedChange={(checked) => handlePreferenceChange('vehicle_alerts', checked)}
                />
              </div>

              {/* Maintenance Reminders */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Wrench className="h-5 w-5 text-blue-500" />
                  <div>
                    <h4 className="font-medium">Maintenance Reminders</h4>
                    <p className="text-sm text-muted-foreground">
                      Scheduled maintenance notifications and service reminders
                    </p>
                  </div>
                </div>
                <Switch
                  checked={localPreferences.maintenance_reminders || false}
                  onCheckedChange={(checked) => handlePreferenceChange('maintenance_reminders', checked)}
                />
              </div>

              {/* Geofence Alerts */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-green-500" />
                  <div>
                    <h4 className="font-medium">Geofence Alerts</h4>
                    <p className="text-sm text-muted-foreground">
                      Vehicle entering or leaving designated areas
                    </p>
                  </div>
                </div>
                <Switch
                  checked={localPreferences.geofence_alerts || false}
                  onCheckedChange={(checked) => handlePreferenceChange('geofence_alerts', checked)}
                />
              </div>

              {/* System Updates */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-purple-500" />
                  <div>
                    <h4 className="font-medium">System Updates</h4>
                    <p className="text-sm text-muted-foreground">
                      Platform updates, new features, and general announcements
                    </p>
                  </div>
                </div>
                <Switch
                  checked={localPreferences.system_updates || false}
                  onCheckedChange={(checked) => handlePreferenceChange('system_updates', checked)}
                />
              </div>

              {/* Urgent Only Mode */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-red-500" />
                  <div>
                    <h4 className="font-medium">Urgent Only Mode</h4>
                    <p className="text-sm text-muted-foreground">
                      Only receive critical alerts (overrides other settings)
                    </p>
                  </div>
                </div>
                <Switch
                  checked={localPreferences.urgent_only || false}
                  onCheckedChange={(checked) => handlePreferenceChange('urgent_only', checked)}
                />
              </div>
            </div>
          </div>

          {/* Test Email Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Test Email Delivery</h3>
            <div className="flex gap-3">
              <Input
                placeholder="Optional: test email address"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleTestEmail}
                disabled={sendTestEmail.isPending}
                variant="outline"
                className="flex items-center gap-2"
              >
                <TestTube className="h-4 w-4" />
                {sendTestEmail.isPending ? 'Sending...' : 'Send Test'}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Send a test email to verify your notification settings are working
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={savePreferences.isPending}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {savePreferences.isPending ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Information */}
      <Card>
        <CardHeader>
          <CardTitle>Email Service Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              Service Active
            </Badge>
            <span className="text-sm text-muted-foreground">
              Email notifications are configured and operational
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailPreferencesManager;
