
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TestTube, MessageSquare, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { smsService, type SMSConfig } from '@/services/smsService';

export default function SMSSettingsTab() {
  const [config, setConfig] = useState<SMSConfig>({
    username: '',
    password: '',
    sender: '',
    route: 1
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
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
          username: savedConfig.api_username,
          password: '', // Don't show saved password
          sender: savedConfig.sender_id,
          route: savedConfig.route
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

  const handleSaveConfiguration = async () => {
    if (!config.username || !config.password || !config.sender) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await smsService.saveSMSConfiguration(config);
      setIsConfigured(true);
      
      toast({
        title: "Configuration Saved",
        description: "SMS gateway configuration has been saved successfully",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save configuration",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConfiguration = async () => {
    if (!config.username || !config.password || !config.sender) {
      toast({
        title: "Configuration Required",
        description: "Please configure SMS settings before testing",
        variant: "destructive"
      });
      return;
    }

    if (testPhone && !smsService.validatePhoneNumber(testPhone)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number in E.164 format (e.g., +2348012345678)",
        variant: "destructive"
      });
      return;
    }

    setIsTesting(true);
    try {
      const result = await smsService.testConfiguration(
        config, 
        testPhone ? smsService.formatPhoneNumber(testPhone) : undefined
      );
      
      if (result.success) {
        toast({
          title: "Test Successful",
          description: "SMS configuration test passed successfully",
        });
      } else {
        toast({
          title: "Test Failed",
          description: result.message || "SMS configuration test failed",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Test Error",
        description: error instanceof Error ? error.message : "Failed to test configuration",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
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
        {getStatusBadge()}
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
                disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
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
              onClick={handleSaveConfiguration}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Settings className="mr-2 h-4 w-4" />
                  Save Configuration
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Test SMS Configuration
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
                disabled={isTesting}
              />
              <p className="text-xs text-muted-foreground">
                Optional: Leave empty to use default test number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="testMessage">Test Message</Label>
              <Input
                id="testMessage"
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                disabled={isTesting}
                maxLength={160}
              />
            </div>
          </div>

          <Button
            onClick={handleTestConfiguration}
            disabled={isTesting || !config.username || !config.password}
            variant="outline"
            className="w-full"
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Configuration...
              </>
            ) : (
              <>
                <TestTube className="mr-2 h-4 w-4" />
                Test SMS Configuration
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
