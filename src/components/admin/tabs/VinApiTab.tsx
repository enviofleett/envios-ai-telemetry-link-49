
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { VinApiService, VinApiConfig } from '@/services/vinApiService';
import { Loader2, TestTube, CheckCircle, XCircle, Key, Shield } from 'lucide-react';

export default function VinApiTab() {
  const { toast } = useToast();
  const [configs, setConfigs] = useState<VinApiConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    provider_name: 'vindecoder',
    api_key: '',
    secret_key: '',
    is_active: true,
    primary_provider: true,
    rate_limit_per_day: 1000
  });

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      const data = await VinApiService.getApiConfigurations();
      setConfigs(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load VIN API configurations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.api_key || !formData.secret_key) {
      toast({
        title: "Validation Error",
        description: "API Key and Secret Key are required",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      await VinApiService.saveApiConfiguration(formData);
      toast({
        title: "Success",
        description: "VIN API configuration saved successfully"
      });
      
      // Reset form
      setFormData({
        provider_name: 'vindecoder',
        api_key: '',
        secret_key: '',
        is_active: true,
        primary_provider: true,
        rate_limit_per_day: 1000
      });
      
      loadConfigurations();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save VIN API configuration",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (configId: string) => {
    setTesting(configId);
    try {
      const result = await VinApiService.testApiConfiguration(configId);
      
      if (result.success) {
        toast({
          title: "Test Successful",
          description: "VIN API configuration is working correctly"
        });
      } else {
        toast({
          title: "Test Failed",
          description: result.error || "VIN API test failed",
          variant: "destructive"
        });
      }
      
      loadConfigurations();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to test VIN API configuration",
        variant: "destructive"
      });
    } finally {
      setTesting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Key className="h-5 w-5" />
        <h2 className="text-xl font-semibold">VIN API Configuration</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>VIN Decoder API Settings</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure VIN decoding service for automatic vehicle data population
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Input
                id="provider"
                value={formData.provider_name}
                onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                placeholder="vindecoder"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate_limit">Rate Limit (per day)</Label>
              <Input
                id="rate_limit"
                type="number"
                value={formData.rate_limit_per_day}
                onChange={(e) => setFormData({ ...formData, rate_limit_per_day: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_key">API Key</Label>
            <Input
              id="api_key"
              type="password"
              value={formData.api_key}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              placeholder="Enter your VIN API key"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secret_key">Secret Key</Label>
            <Input
              id="secret_key"
              type="password"
              value={formData.secret_key}
              onChange={(e) => setFormData({ ...formData, secret_key: e.target.value })}
              placeholder="Enter your VIN API secret key"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="primary_provider"
                checked={formData.primary_provider}
                onCheckedChange={(checked) => setFormData({ ...formData, primary_provider: checked })}
              />
              <Label htmlFor="primary_provider">Primary Provider</Label>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
            Save Configuration
          </Button>
        </CardContent>
      </Card>

      {configs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Configurations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {configs.map((config) => (
                <div key={config.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{config.provider_name}</div>
                    <div className="text-sm text-muted-foreground">
                      Rate limit: {config.rate_limit_per_day}/day
                      {config.last_tested_at && (
                        <span className="ml-2">
                          Last tested: {new Date(config.last_tested_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {config.test_status === 'success' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {config.test_status === 'failed' && (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(config.id)}
                      disabled={testing === config.id}
                    >
                      {testing === config.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <TestTube className="h-4 w-4" />
                      )}
                      Test
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>How to Get VIN API Credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            1. Visit <a href="https://vindecoder.eu" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">vindecoder.eu</a>
          </p>
          <p className="text-sm text-muted-foreground">
            2. Sign up for an account and purchase API credits
          </p>
          <p className="text-sm text-muted-foreground">
            3. Navigate to your API dashboard to get your API Key and Secret Key
          </p>
          <p className="text-sm text-muted-foreground">
            4. Enter the credentials above and test the configuration
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
