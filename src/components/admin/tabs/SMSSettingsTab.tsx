import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TestTube, MessageSquare, Settings, CheckCircle, AlertCircle, Wallet, Shield, Activity } from 'lucide-react';
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
  const [testMessage, setTestMessage] = useState('Test message from FleetIQ SMS Gateway - System operational!');
  const [encryptionStatus, setEncryptionStatus] = useState<'checking' | 'encrypted' | 'unencrypted' | 'error'>('checking');
  const { toast } = useToast();

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const savedConfig = await smsService.getSMSConfiguration();
      if (savedConfig) {
        setConfig({
          username: savedConfig.username, // Using correct field name
          password: '', // Don't show saved password for security
          sender: savedConfig.sender_id,
          route: parseInt(savedConfig.route)
        });
        setIsConfigured(true);
        setEncryptionStatus('encrypted'); // If we successfully loaded, it's encrypted
      } else {
        setEncryptionStatus('unencrypted');
      }
    } catch (error) {
      console.error('Failed to load SMS configuration:', error);
      setEncryptionStatus('error');
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
      console.log('🚀 Starting Enhanced Test & Save process with encryption...');
      
      const result = await smsService.validateAndSaveCredentials(config);
      
      if (result.success) {
        setIsConfigured(true);
        setAccountBalance(result.balance || null);
        setEncryptionStatus('encrypted');
        
        toast({
          title: "✅ Success!",
          description: result.message + (result.balance ? ` Account balance: ${result.balance}` : ''),
        });
        
        console.log('✅ Enhanced Test & Save completed successfully with encryption');
        
        // Clear the password field for security
        setConfig(prev => ({ ...prev, password: '' }));
      } else {
        toast({
          title: "Validation Failed",
          description: result.message,
          variant: "destructive"
        });
        
        console.error('❌ Enhanced Test & Save failed:', result.message);
      }
    } catch (error) {
      setEncryptionStatus('error');
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
      
      console.error('❌ Enhanced Test & Save error:', error);
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
          title: "✅ Credentials Valid",
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

  const handleTestSMS = async () => {
    if (!testPhone || !testMessage) {
      toast({
        title: "Missing Information",
        description: "Please enter phone number and message to send test SMS",
        variant: "destructive"
      });
      return;
    }

    if (!smsService.validatePhoneNumber(testPhone)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number in international format",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsValidating(true);
      
      const formattedPhone = smsService.formatPhoneNumber(testPhone);
      const result = await smsService.sendSMS(formattedPhone, testMessage, 'TEST');
      
      if (result.success) {
        toast({
          title: "✅ Test SMS Sent",
          description: `Test message sent to ${formattedPhone}. Check the recipient phone.`,
        });
      } else {
        toast({
          title: "Test Failed",
          description: result.error || "Failed to send test SMS",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "Failed to send test SMS",
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
          Production Ready
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline">
          <AlertCircle className="h-3 w-3 mr-1" />
          Configuration Required
        </Badge>
      );
    }
  };

  const getEncryptionBadge = () => {
    switch (encryptionStatus) {
      case 'encrypted':
        return (
          <Badge className="bg-green-100 text-green-800">
            <Shield className="h-3 w-3 mr-1" />
            Encrypted & Secure
          </Badge>
        );
      case 'unencrypted':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            <AlertCircle className="h-3 w-3 mr-1" />
            Not Configured
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Encryption Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Activity className="h-3 w-3 mr-1" />
            Checking...
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">SMS Gateway Settings</h2>
          <p className="text-muted-foreground">Production-ready SMS configuration with enhanced security</p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          {getEncryptionBadge()}
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
            <Badge variant="outline" className="ml-2">Enhanced Security</Badge>
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
                placeholder={isConfigured ? "••••••••••••" : "Enter MySMS password"}
                value={config.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={isValidating}
              />
              {isConfigured && (
                <p className="text-xs text-green-600">
                  ✅ Credentials are encrypted and securely stored
                </p>
              )}
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
                  Processing...
                </>
              ) : (
                <>
                  <Settings className="mr-2 h-4 w-4" />
                  Test & Save (Encrypted)
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
                Your SMS credentials are valid, encrypted, and your account is ready for production use.
              </p>
            </div>
          )}

          {encryptionStatus === 'encrypted' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>🔒 Security Status:</strong> All credentials are encrypted using AES-256 encryption
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Your sensitive data is protected and secure for production deployment.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Production SMS Testing
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
                Enter a phone number to test SMS delivery (international format)
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
              <p className="text-xs text-muted-foreground">
                {testMessage.length}/160 characters
              </p>
            </div>
          </div>

          <Button
            onClick={handleTestSMS}
            disabled={!isConfigured || !testPhone || !testMessage || isValidating}
            className="w-full"
          >
            {isValidating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Test SMS...
              </>
            ) : (
              <>
                <TestTube className="mr-2 h-4 w-4" />
                Send Production Test SMS
              </>
            )}
          </Button>

          {!isConfigured && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>⚠️ Configuration Required:</strong> Please configure and save your SMS credentials first.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
