
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Globe, 
  Key, 
  Settings, 
  Activity, 
  BarChart3, 
  Shield,
  Zap,
  Link,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

interface APIConfig {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'error';
  lastUsed: string;
  requestCount: number;
  rateLimit: string;
  icon: React.ComponentType<{ className?: string }>;
}

const APIIntegrationsTab: React.FC = () => {
  const [apis, setApis] = useState<APIConfig[]>([
    {
      id: 'vin-api',
      name: 'VIN Decoder API',
      description: 'Vehicle identification number decoding service',
      status: 'active',
      lastUsed: '2 hours ago',
      requestCount: 1247,
      rateLimit: '1000/day',
      icon: Key
    },
    {
      id: 'maps-api',
      name: 'Maps & Geocoding API',
      description: 'Location services and address geocoding',
      status: 'active',
      lastUsed: '15 minutes ago',
      requestCount: 5623,
      rateLimit: '10000/day',
      icon: Globe
    },
    {
      id: 'whatsapp-api',
      name: 'WhatsApp Business API',
      description: 'WhatsApp messaging integration via WAAPI.app',
      status: 'inactive',
      lastUsed: 'Never',
      requestCount: 0,
      rateLimit: '1000/day',
      icon: Zap
    },
    {
      id: 'gp51-api',
      name: 'GP51 Tracking API',
      description: 'Vehicle tracking and fleet management',
      status: 'error',
      lastUsed: '1 day ago',
      requestCount: 8934,
      rateLimit: 'Unlimited',
      icon: Activity
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
        return <XCircle className="h-4 w-4 text-gray-400" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const toggleAPIStatus = (apiId: string) => {
    setApis(apis.map(api => 
      api.id === apiId 
        ? { 
            ...api, 
            status: api.status === 'active' ? 'inactive' : 'active' 
          }
        : api
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Integrations</h2>
          <p className="text-muted-foreground">
            Manage external API integrations and monitor their usage
          </p>
        </div>
        <Button>
          <Link className="h-4 w-4 mr-2" />
          Add New Integration
        </Button>
      </div>

      <div className="grid gap-4">
        {apis.map((api) => {
          const IconComponent = api.icon;
          return (
            <Card key={api.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <IconComponent className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{api.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{api.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(api.status)}
                    {getStatusBadge(api.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{api.requestCount.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Total Requests</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold">{api.rateLimit}</div>
                    <div className="text-xs text-muted-foreground">Rate Limit</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold">{api.lastUsed}</div>
                    <div className="text-xs text-muted-foreground">Last Used</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold">99.9%</div>
                    <div className="text-xs text-muted-foreground">Uptime</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={api.status === 'active'}
                        onCheckedChange={() => toggleAPIStatus(api.id)}
                      />
                      <span className="text-sm">
                        {api.status === 'active' ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-1" />
                      Configure
                    </Button>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Analytics
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            • Always use HTTPS for API communications
          </p>
          <p className="text-sm text-muted-foreground">
            • Store API keys securely using Supabase secrets
          </p>
          <p className="text-sm text-muted-foreground">
            • Monitor API usage to avoid rate limiting
          </p>
          <p className="text-sm text-muted-foreground">
            • Implement proper error handling and retry logic
          </p>
          <p className="text-sm text-muted-foreground">
            • Regularly rotate API keys for enhanced security
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default APIIntegrationsTab;
