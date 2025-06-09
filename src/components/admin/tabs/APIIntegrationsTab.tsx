
import React, { useState } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Globe, Link, TestTube, CheckCircle, XCircle, AlertCircle, Shield } from 'lucide-react';

interface GPSCredential {
  id: string;
  provider: string;
  name: string;
  apiUrl: string;
  username: string;
  password: string;
  isActive: boolean;
  lastTested?: Date;
  status: 'connected' | 'disconnected' | 'error';
}

export const APIIntegrationsTab: React.FC = () => {
  const { toast } = useToast();
  const [credentials, setCredentials] = useState<GPSCredential[]>([
    {
      id: '1',
      provider: 'gp51',
      name: 'Primary GP51 Connection',
      apiUrl: 'https://www.gps51.com',
      username: '',
      password: '',
      isActive: true,
      status: 'disconnected'
    }
  ]);
  
  const [selectedProvider, setSelectedProvider] = useState<string>('gp51');
  const [formData, setFormData] = useState({
    name: '',
    apiUrl: '',
    username: '',
    password: ''
  });
  const [isAdding, setIsAdding] = useState(false);
  const [isTesting, setIsTesting] = useState<string | null>(null);

  const providers = [
    { value: 'gp51', label: 'GPS51', defaultUrl: 'https://www.gps51.com' },
    { value: 'generic_gps', label: 'Generic GPS Tracker', defaultUrl: '' },
    { value: 'traccar', label: 'Traccar', defaultUrl: 'http://localhost:8082' },
    { value: 'custom', label: 'Custom GPS API', defaultUrl: '' }
  ];

  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    const providerInfo = providers.find(p => p.value === provider);
    setFormData(prev => ({
      ...prev,
      apiUrl: providerInfo?.defaultUrl || ''
    }));
  };

  const handleTestConnection = async (credentialId: string) => {
    setIsTesting(credentialId);
    
    try {
      // Simulate API test - replace with actual test logic
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setCredentials(prev => prev.map(cred => 
        cred.id === credentialId 
          ? { ...cred, status: 'connected' as const, lastTested: new Date() }
          : cred
      ));
      
      toast({
        title: "Connection Test Successful",
        description: "GPS API connection is working properly",
      });
    } catch (error) {
      setCredentials(prev => prev.map(cred => 
        cred.id === credentialId 
          ? { ...cred, status: 'error' as const, lastTested: new Date() }
          : cred
      ));
      
      toast({
        title: "Connection Test Failed",
        description: "Failed to connect to GPS API",
        variant: "destructive"
      });
    } finally {
      setIsTesting(null);
    }
  };

  const handleSaveCredential = () => {
    if (!formData.name || !formData.apiUrl || !formData.username || !formData.password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const newCredential: GPSCredential = {
      id: Date.now().toString(),
      provider: selectedProvider,
      name: formData.name,
      apiUrl: formData.apiUrl,
      username: formData.username,
      password: formData.password,
      isActive: true,
      status: 'disconnected'
    };

    setCredentials(prev => [...prev, newCredential]);
    setFormData({ name: '', apiUrl: '', username: '', password: '' });
    setIsAdding(false);
    
    toast({
      title: "Credentials Saved",
      description: `${formData.name} has been added successfully`,
    });
  };

  const getStatusIcon = (status: GPSCredential['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: GPSCredential['status']) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Not Tested</Badge>;
    }
  };

  return (
    <TabsContent value="api-integrations" className="space-y-6 mt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6" />
            API Integrations
          </h2>
          <p className="text-muted-foreground">
            Manage GPS tracking and API service connections
          </p>
        </div>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Link className="h-4 w-4 mr-2" />
          Add Integration
        </Button>
      </div>

      <Tabs defaultValue="gps-providers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="gps-providers">GPS Providers</TabsTrigger>
          <TabsTrigger value="other-apis">Other APIs</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="gps-providers" className="space-y-6">
          {isAdding && (
            <Card>
              <CardHeader>
                <CardTitle>Add New GPS Integration</CardTitle>
                <CardDescription>
                  Configure a new GPS tracking service connection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="provider">Provider Type</Label>
                    <Select value={selectedProvider} onValueChange={handleProviderChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {providers.map(provider => (
                          <SelectItem key={provider.value} value={provider.value}>
                            {provider.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Connection Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Primary GPS51 Connection"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiUrl">API URL</Label>
                  <Input
                    id="apiUrl"
                    placeholder="https://api.example.com"
                    value={formData.apiUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, apiUrl: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="Enter username"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveCredential}>
                    Save Integration
                  </Button>
                  <Button variant="outline" onClick={() => setIsAdding(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {credentials.map((credential) => (
              <Card key={credential.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(credential.status)}
                      <div>
                        <CardTitle className="text-lg">{credential.name}</CardTitle>
                        <CardDescription>
                          {providers.find(p => p.value === credential.provider)?.label} • {credential.apiUrl}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(credential.status)}
                      {credential.isActive && (
                        <Badge variant="outline">Active</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Username:</span>
                      <div className="text-muted-foreground">{credential.username}</div>
                    </div>
                    <div>
                      <span className="font-medium">Last Tested:</span>
                      <div className="text-muted-foreground">
                        {credential.lastTested 
                          ? credential.lastTested.toLocaleString() 
                          : 'Never'
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleTestConnection(credential.id)}
                      disabled={isTesting === credential.id}
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      {isTesting === credential.id ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                    <Button size="sm" variant="outline">
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="other-apis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Other API Services</CardTitle>
              <CardDescription>
                Configure additional API integrations like mapping, notifications, etc.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Additional API integrations (Maps, SMS, Email services) will be available here.
                  Currently focusing on GPS provider integrations.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage API security, encryption, and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  All API credentials are encrypted and stored securely. 
                  Regular security audits and rotation schedules can be configured here.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Credential Encryption</h4>
                    <p className="text-sm text-muted-foreground">
                      All stored credentials are encrypted at rest
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Connection Monitoring</h4>
                    <p className="text-sm text-muted-foreground">
                      Monitor API connections for security issues
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </TabsContent>
  );
};

export default APIIntegrationsTab;
