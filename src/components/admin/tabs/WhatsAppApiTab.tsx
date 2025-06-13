
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, MessageCircle, Send, TestTube, CheckCircle, XCircle, Phone, Globe } from 'lucide-react';

export default function WhatsAppApiTab() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState(false);
  
  const [config, setConfig] = useState({
    api_key: '',
    instance_id: '',
    webhook_url: '',
    is_active: true,
    auto_reply: false,
    business_name: '',
    phone_number: ''
  });

  const [testMessage, setTestMessage] = useState({
    phone: '',
    message: 'Hello! This is a test message from your WhatsApp API integration.'
  });

  const handleSaveConfig = async () => {
    if (!config.api_key || !config.instance_id) {
      toast({
        title: "Validation Error",
        description: "API Key and Instance ID are required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Save configuration logic here
      console.log('Saving WhatsApp API configuration:', config);
      
      toast({
        title: "Success",
        description: "WhatsApp API configuration saved successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save WhatsApp API configuration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      // Test connection to waapi.app
      const response = await fetch(`https://waapi.app/api/v1/instances/${config.instance_id}/client/action/get-qr`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.api_key}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setConnected(true);
        toast({
          title: "Connection Successful",
          description: "WhatsApp API is connected and working"
        });
      } else {
        setConnected(false);
        toast({
          title: "Connection Failed",
          description: "Unable to connect to WhatsApp API",
          variant: "destructive"
        });
      }
    } catch (error) {
      setConnected(false);
      toast({
        title: "Test Failed",
        description: "Error testing WhatsApp API connection",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!testMessage.phone || !testMessage.message) {
      toast({
        title: "Validation Error",
        description: "Phone number and message are required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`https://waapi.app/api/v1/instances/${config.instance_id}/client/action/send-message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chatId: `${testMessage.phone}@c.us`,
          message: testMessage.message
        })
      });

      if (response.ok) {
        toast({
          title: "Message Sent",
          description: "Test message sent successfully"
        });
      } else {
        toast({
          title: "Send Failed",
          description: "Failed to send test message",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error sending test message",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        <h2 className="text-xl font-semibold">WhatsApp API Configuration</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>WAAPI.app Integration</span>
            {connected ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure WhatsApp Business API integration using waapi.app service
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="api_key">API Key</Label>
              <Input
                id="api_key"
                type="password"
                value={config.api_key}
                onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                placeholder="Enter your WAAPI.app API key"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instance_id">Instance ID</Label>
              <Input
                id="instance_id"
                value={config.instance_id}
                onChange={(e) => setConfig({ ...config, instance_id: e.target.value })}
                placeholder="Enter your WhatsApp instance ID"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhook_url">Webhook URL</Label>
            <Input
              id="webhook_url"
              value={config.webhook_url}
              onChange={(e) => setConfig({ ...config, webhook_url: e.target.value })}
              placeholder="https://your-app.com/webhook/whatsapp"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                value={config.business_name}
                onChange={(e) => setConfig({ ...config, business_name: e.target.value })}
                placeholder="Your business name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                value={config.phone_number}
                onChange={(e) => setConfig({ ...config, phone_number: e.target.value })}
                placeholder="+1234567890"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={config.is_active}
                onCheckedChange={(checked) => setConfig({ ...config, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="auto_reply"
                checked={config.auto_reply}
                onCheckedChange={(checked) => setConfig({ ...config, auto_reply: checked })}
              />
              <Label htmlFor="auto_reply">Auto Reply</Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSaveConfig} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageCircle className="mr-2 h-4 w-4" />}
              Save Configuration
            </Button>

            <Button variant="outline" onClick={handleTestConnection} disabled={testing}>
              {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TestTube className="mr-2 h-4 w-4" />}
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Send Test Message</CardTitle>
          <p className="text-sm text-muted-foreground">
            Send a test message to verify your WhatsApp API integration
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test_phone">Phone Number (with country code)</Label>
            <Input
              id="test_phone"
              value={testMessage.phone}
              onChange={(e) => setTestMessage({ ...testMessage, phone: e.target.value })}
              placeholder="+1234567890"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="test_message">Test Message</Label>
            <Textarea
              id="test_message"
              value={testMessage.message}
              onChange={(e) => setTestMessage({ ...testMessage, message: e.target.value })}
              placeholder="Enter your test message"
              rows={3}
            />
          </div>

          <Button onClick={handleSendTestMessage} disabled={loading || !connected}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Send Test Message
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            1. Visit <a href="https://waapi.app" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">waapi.app</a> and create an account
          </p>
          <p className="text-sm text-muted-foreground">
            2. Create a new WhatsApp instance and get your Instance ID
          </p>
          <p className="text-sm text-muted-foreground">
            3. Generate an API key from your dashboard
          </p>
          <p className="text-sm text-muted-foreground">
            4. Connect your WhatsApp Business account to the instance
          </p>
          <p className="text-sm text-muted-foreground">
            5. Configure the webhook URL to receive incoming messages
          </p>
          <p className="text-sm text-muted-foreground">
            6. Test the connection and start sending messages
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
