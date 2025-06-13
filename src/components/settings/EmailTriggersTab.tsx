
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useEmailTriggers } from '@/hooks/useEmailTriggers';
import { Mail, Send, Zap, TestTube } from 'lucide-react';

const EmailTriggersTab: React.FC = () => {
  const { isTriggering, triggerUserWelcome, triggerPasswordReset, triggerVehicleOffline, triggerMaintenanceReminder } = useEmailTriggers();
  
  const [testEmail, setTestEmail] = useState('');
  const [testName, setTestName] = useState('');
  const [testTriggerType, setTestTriggerType] = useState('user_registration');
  const [testMessage, setTestMessage] = useState('');

  const handleTestTrigger = async () => {
    if (!testEmail || !testName) return;

    switch (testTriggerType) {
      case 'user_registration':
        await triggerUserWelcome(testEmail, testName, 'Test Company');
        break;
      case 'password_reset':
        await triggerPasswordReset(testEmail, testName, 'test-token-123');
        break;
      case 'vehicle_offline':
        await triggerVehicleOffline(
          'test-vehicle-123',
          'Test Vehicle',
          'DEV001',
          new Date(),
          'Test Location'
        );
        break;
      case 'maintenance_reminder':
        await triggerMaintenanceReminder(
          'test-vehicle-123',
          'Test Vehicle',
          'Oil Change',
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        );
        break;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Email Triggers
          </CardTitle>
          <CardDescription>
            Test and manage automated email triggers for your fleet management system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Trigger Testing Section */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <TestTube className="h-4 w-4" />
              <h3 className="font-medium">Test Email Triggers</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="test-email">Test Email Address</Label>
                <Input
                  id="test-email"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="test-name">Test User Name</Label>
                <Input
                  id="test-name"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trigger-type">Trigger Type</Label>
              <Select value={testTriggerType} onValueChange={setTestTriggerType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select trigger type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user_registration">User Registration Welcome</SelectItem>
                  <SelectItem value="password_reset">Password Reset Request</SelectItem>
                  <SelectItem value="vehicle_offline">Vehicle Offline Alert</SelectItem>
                  <SelectItem value="maintenance_reminder">Maintenance Reminder</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleTestTrigger} 
              disabled={!testEmail || !testName || isTriggering}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {isTriggering ? 'Sending...' : 'Send Test Email'}
            </Button>
          </div>

          {/* Trigger Types Overview */}
          <div className="grid gap-4">
            <h3 className="font-medium">Available Email Triggers</h3>
            
            <div className="grid gap-3">
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">User Registration Welcome</p>
                  <p className="text-sm text-muted-foreground">Sent when new users register</p>
                </div>
                <Mail className="h-4 w-4 text-blue-500" />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">Password Reset Request</p>
                  <p className="text-sm text-muted-foreground">Sent when users request password reset</p>
                </div>
                <Mail className="h-4 w-4 text-orange-500" />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">Vehicle Offline Alert</p>
                  <p className="text-sm text-muted-foreground">Sent when vehicles go offline</p>
                </div>
                <Mail className="h-4 w-4 text-red-500" />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">Maintenance Reminder</p>
                  <p className="text-sm text-muted-foreground">Sent for upcoming maintenance</p>
                </div>
                <Mail className="h-4 w-4 text-green-500" />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">Geofence Alerts</p>
                  <p className="text-sm text-muted-foreground">Sent for geofence violations</p>
                </div>
                <Mail className="h-4 w-4 text-purple-500" />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">System Notifications</p>
                  <p className="text-sm text-muted-foreground">Sent for system updates and alerts</p>
                </div>
                <Mail className="h-4 w-4 text-gray-500" />
              </div>
            </div>
          </div>

          {/* Integration Status */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-green-600" />
              <p className="font-medium text-green-800">Email Triggers Active</p>
            </div>
            <p className="text-sm text-green-700">
              All email triggers are properly configured and ready to send automated emails based on system events.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailTriggersTab;
