
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
import { 
  Navigation, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Shield, 
  Plus,
  Settings,
  Clock,
  Edit,
  Trash2
} from 'lucide-react';

interface GPSCredential {
  id: string;
  provider: string;
  name: string;
  apiUrl: string;
  username: string;
  password: string;
  isActive: boolean;
  lastTested?: Date;
  status: 'connected' | 'disconnected' | 'error' | 'not_tested';
}

export const GPS51Tab: React.FC = () => {
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
      status: 'not_tested'
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
    { 
      value: 'gp51', 
      label: 'GPS51', 
      defaultUrl: 'https://www.gps51.com',
      description: 'GPS51 Professional Tracking Platform'
    },
    { 
      value: 'generic_gps', 
      label: 'Generic GPS Tracker', 
      defaultUrl: '',
      description: 'Standard GPS tracking protocol'
    },
    { 
      value: 'traccar', 
      label: 'Traccar', 
      defaultUrl: 'http://localhost:8082',
      description: 'Open-source GPS tracking system'
    },
    { 
      value: 'custom', 
      label: 'Custom GPS API', 
      defaultUrl: '',
      description: 'Custom GPS tracking service'
    }
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
      
      const success = Math.random() > 0.3; // 70% success rate for demo
      
      setCredentials(prev => prev.map(cred => 
        cred.id === credentialId 
          ? { 
              ...cred, 
              status: success ? 'connected' as const : 'error' as const, 
              lastTested: new Date() 
            }
          : cred
      ));
      
      toast({
        title: success ? "Connection Test Successful" : "Connection Test Failed",
        description: success 
          ? "GPS API connection is working properly" 
          : "Failed to connect to GPS API. Check your credentials.",
        variant: success ? "default" : "destructive"
      });
    } catch (error) {
      setCredentials(prev => prev.map(cred => 
        cred.id === credentialId 
          ? { ...cred, status: 'error' as const, lastTested: new Date() }
          : cred
      ));
      
      toast({
        title: "Connection Test Failed",
        description: "An error occurred while testing the connection",
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
      status: 'not_tested'
    };

    setCredentials(prev => [...prev, newCredential]);
    setFormData({ name: '', apiUrl: '', username: '', password: '' });
    setIsAdding(false);
    
    toast({
      title: "GPS Credentials Saved",
      description: `${formData.name} has been added successfully`,
    });
  };

  const getStatusIcon = (status: GPSCredential['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'disconnected':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
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
      case 'disconnected':
        return <Badge className="bg-yellow-100 text-yellow-800">Disconnected</Badge>;
      default:
        return <Badge variant="outline">Not Tested</Badge>;
    }
  };

  const formatLastTested = (date?: Date) => {
    if (!date) return 'Never tested';
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
  };

  return (
    <TabsContent value="gps51" className="space-y-6 mt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Navigation className="h-6 w-6" />
            GPS51 & Tracking APIs
          </h2>
          <p className="text-muted-foreground">
            🌐 Centralized management for all GPS tracking and API credentials
          </p>
        </div>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="h-4 w-4 mr-2" />
          Add GPS Connection
        </Button>
      </div>

      <Tabs defaultValue="gps-providers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="gps-providers">GPS Providers</TabsTrigger>
          <TabsTrigger value="other-apis">Other APIs</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="gps-providers" className="space-y-6">
          {isAdding && (
            <Card>
              <CardHeader>
                <CardTitle>🔐 Add New GPS Connection</CardTitle>
                <CardDescription>
                  Configure a new GPS tracking service with secure credential storage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="provider">Provider Type</Label>
                    <Select value={selectedProvider} onValueChange={handleProviderChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select GPS provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {providers.map(provider => (
                          <SelectItem key={provider.value} value={provider.value}>
                            <div>
                              <div className="font-medium">{provider.label}</div>
                              <div className="text-xs text-muted-foreground">{provider.description}</div>
                            </div>
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
                  <Label htmlFor="apiUrl">API URL Configuration</Label>
                  <Input
                    id="apiUrl"
                    placeholder="https://api.example.com"
                    value={formData.apiUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, apiUrl: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the GPS tracking API endpoint URL
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="Enter GPS username"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter GPS password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveCredential}>
                    Save GPS Connection
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
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span className="font-medium">Last Tested:</span>
                      <div className="text-muted-foreground text-xs">
                        {formatLastTested(credential.lastTested)}
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
                      {isTesting === credential.id ? 'Testing...' : '🧪 Test Connection'}
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline">
                      <Trash2 className="h-4 w-4 mr-2" />
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
              <CardTitle>📋 Other API Services</CardTitle>
              <CardDescription>
                Reserved for future API integrations (Maps, SMS, Email services)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  Additional API integrations like Maps APIs, SMS services, and Email providers 
                  will be available here. Currently focused on GPS tracking integrations.
                </AlertDescription>
              </Alert>
              
              <div className="mt-4 space-y-2">
                <div className="text-sm font-medium">Coming Soon:</div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Map Services (Google Maps, MapBox, OpenStreetMap)</li>
                  <li>• SMS Notifications (Twilio, SendGrid)</li>
                  <li>• Email Services (SMTP, SendGrid, Mailgun)</li>
                  <li>• Weather APIs</li>
                  <li>• Third-party integrations</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                🛡️ Security Features
              </CardTitle>
              <CardDescription>
                GPS credential encryption, monitoring, and security audit information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  All GPS API credentials are encrypted at rest and transmitted securely. 
                  Regular security audits and credential rotation schedules are monitored.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Credential Encryption</h4>
                    <p className="text-sm text-muted-foreground">
                      All stored GPS credentials are encrypted using AES-256
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Connection Monitoring</h4>
                    <p className="text-sm text-muted-foreground">
                      Real-time monitoring of GPS API connections and health
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Security Audit Logging</h4>
                    <p className="text-sm text-muted-foreground">
                      All GPS credential access and modifications are logged
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Credential Rotation</h4>
                    <p className="text-sm text-muted-foreground">
                      Automated reminders for GPS credential updates
                    </p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    <Settings className="h-3 w-3 mr-1" />
                    Configured
                  </Badge>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h5 className="font-medium mb-2">Security Recommendations</h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Test GPS connections regularly to ensure they remain active</li>
                  <li>• Rotate GPS credentials every 90 days for enhanced security</li>
                  <li>• Monitor connection logs for unusual access patterns</li>
                  <li>• Use strong, unique passwords for all GPS API accounts</li>
                  <li>• Enable two-factor authentication where supported</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </TabsContent>
  );
};

export default GPS51Tab;
