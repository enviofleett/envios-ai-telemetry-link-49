
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TestTube, MessageSquare, Settings, CheckCircle, AlertCircle, Wallet } from 'lucide-react';
import { smsService, type SMSConfig } from '@/services/smsService';

export default function SMSSettingsTab() {
  const [config, setConfig] = useState<SMSConfig>({
    username: '',
    password: '',
    sender: '',
    route: 1
  });
  const [isValidating, setIsValidating] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [accountBalance, setAccountBalance] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Test message from FleetIQ SMS Gateway');
  const { toast } = useToast();

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const savedConfig = await smsService.getSMSConfiguration();
      if (savedConfig) {
        setConfig({
          username: savedConfig.username,
          password: '', // Don't show saved password
          sender: savedConfig.sender_id,
          route: parseInt(savedConfig.route)
        });
        setIsConfigured(true);
      }
    } catch (error) {
      console.error('Failed to load SMS configuration:', error);
    }
  };

  const handleInputChange = (field: keyof SMSConfig, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTestAndSave = async () => {
    if (!config.username || !config.password || !config.sender) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsValidating(true);
    setAccountBalance(null);
    
    try {
      console.log('🚀 Starting Test & Save process...');
      
      const result = await smsService.validateAndSaveCredentials(config);
      
      if (result.success) {
        setIsConfigured(true);
        setAccountBalance(result.balance || null);
        
        toast({
          title: "Success!",
          description: result.message + (result.balance ? ` Account balance: ${result.balance}` : ''),
        });
        
        console.log('✅ Test & Save completed successfully');
      } else {
        toast({
          title: "Validation Failed",
          description: result.message,
          variant: "destructive"
        });
        
        console.error('❌ Test & Save failed:', result.message);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
      
      console.error('❌ Test & Save error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleQuickValidation = async () => {
    if (!config.username || !config.password) {
      toast({
        title: "Missing Credentials",
        description: "Please enter username and password to validate",
        variant: "destructive"
      });
      return;
    }

    setIsValidating(true);
    setAccountBalance(null);
    
    try {
      const result = await smsService.validateCredentials(config.username, config.password);
      
      if (result.success) {
        setAccountBalance(result.balance || null);
        toast({
          title: "Credentials Valid",
          description: `Credentials verified successfully! ${result.balance ? `Balance: ${result.balance}` : ''}`,
        });
      } else {
        toast({
          title: "Validation Failed",
          description: result.error || "Invalid credentials",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Validation Error",
        description: "Failed to validate credentials",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const getStatusBadge = () => {
    if (isConfigured) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Configured
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline">
          <AlertCircle className="h-3 w-3 mr-1" />
          Not Configured
        </Badge>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">SMS Gateway Settings</h2>
          <p className="text-muted-foreground">Configure SMS provider for notifications and OTP delivery</p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          {accountBalance && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              <Wallet className="h-3 w-3 mr-1" />
              Balance: {accountBalance}
            </Badge>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            MySMS Provider Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">API Username *</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter MySMS username"
                value={config.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                disabled={isValidating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">API Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter MySMS password"
                value={config.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={isValidating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sender">Sender ID *</Label>
              <Input
                id="sender"
                type="text"
                placeholder="e.g., FleetIQ"
                value={config.sender}
                onChange={(e) => handleInputChange('sender', e.target.value)}
                disabled={isValidating}
                maxLength={11}
              />
              <p className="text-xs text-muted-foreground">
                Sender name that appears on SMS (max 11 characters)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="route">Route</Label>
              <Select 
                value={config.route.toString()} 
                onValueChange={(value) => handleInputChange('route', parseInt(value))}
                disabled={isValidating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Route 1 (Standard)</SelectItem>
                  <SelectItem value="2">Route 2 (Premium)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleQuickValidation}
              disabled={isValidating || !config.username || !config.password}
              variant="outline"
              className="flex-1"
            >
              {isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <TestTube className="mr-2 h-4 w-4" />
                  Quick Validate
                </>
              )}
            </Button>

            <Button
              onClick={handleTestAndSave}
              disabled={isValidating || !config.username || !config.password || !config.sender}
              className="flex-1"
            >
              {isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing & Saving...
                </>
              ) : (
                <>
                  <Settings className="mr-2 h-4 w-4" />
                  Test & Save Configuration
                </>
              )}
            </Button>
          </div>

          {accountBalance && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>✅ Account Balance:</strong> {accountBalance}
              </p>
              <p className="text-xs text-green-700 mt-1">
                Your SMS credentials are valid and your account is ready to send messages.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Send Test SMS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="testPhone">Test Phone Number</Label>
              <Input
                id="testPhone"
                type="tel"
                placeholder="+2348012345678"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                disabled={!isConfigured}
              />
              <p className="text-xs text-muted-foreground">
                Enter a phone number to test SMS delivery
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="testMessage">Test Message</Label>
              <Input
                id="testMessage"
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                disabled={!isConfigured}
                maxLength={160}
              />
            </div>
          </div>

          <Button
            onClick={() => {
              if (testPhone && smsService.validatePhoneNumber(testPhone)) {
                smsService.sendSMS(smsService.formatPhoneNumber(testPhone), testMessage, 'TEST')
                  .then(() => {
                    toast({
                      title: "Test SMS Sent",
                      description: "Check the recipient phone for the test message",
                    });
                  })
                  .catch(() => {
                    toast({
                      title: "Test Failed",
                      description: "Failed to send test SMS",
                      variant: "destructive"
                    });
                  });
              } else {
                toast({
                  title: "Invalid Phone Number",
                  description: "Please enter a valid phone number",
                  variant: "destructive"
                });
              }
            }}
            disabled={!isConfigured || !testPhone || !testMessage}
            variant="outline"
            className="w-full"
          >
            <TestTube className="mr-2 h-4 w-4" />
            Send Test SMS
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
