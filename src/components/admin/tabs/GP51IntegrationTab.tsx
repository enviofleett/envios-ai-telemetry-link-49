
import React, { useState } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GP51CredentialsForm } from '@/components/gp51/GP51CredentialsForm';
import { GP51DeviceList } from '@/components/gp51/GP51DeviceList';
import { GP51StatusIndicator } from '@/components/gp51/GP51StatusIndicator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  CheckCircle, 
  Settings, 
  Activity,
  Globe,
  Lock
} from 'lucide-react';

export const GP51IntegrationTab: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <TabsContent value="gp51" className="space-y-6 mt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            GP51 API Integration
          </h2>
          <p className="text-muted-foreground">
            🌐 Centralized GP51 tracking system connection and vehicle data synchronization
          </p>
        </div>
      </div>

      <Tabs defaultValue="connection" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                GP51 Connection Status
              </CardTitle>
              <CardDescription>
                Real-time status of your GP51 integration and session health
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GP51StatusIndicator />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                🔐 GP51 API Configuration
              </CardTitle>
              <CardDescription>
                Configure your GP51 tracking system credentials with secure storage and automatic session management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GP51CredentialsForm onConnectionChange={setIsConnected} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Connected Devices
              </CardTitle>
              <CardDescription>
                Manage and monitor your GP51 connected devices and vehicle fleet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isConnected ? (
                <GP51DeviceList />
              ) : (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Please establish a GP51 connection first to view and manage your devices.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                📊 Connection Monitoring
              </CardTitle>
              <CardDescription>
                Real-time monitoring of GP51 API connections and system health
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Activity className="h-4 w-4" />
                <AlertDescription>
                  Connection monitoring provides real-time insights into GP51 API performance, 
                  session status, and data synchronization health.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">API Response Time</h4>
                    <p className="text-sm text-muted-foreground">
                      Monitor GP51 API latency and performance
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Monitored
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Session Health</h4>
                    <p className="text-sm text-muted-foreground">
                      Track GP51 session validity and auto-renewal
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Data Synchronization</h4>
                    <p className="text-sm text-muted-foreground">
                      Monitor vehicle data sync and updates
                    </p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    <Settings className="h-3 w-3 mr-1" />
                    Configured
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                🛡️ Security Features
              </CardTitle>
              <CardDescription>
                GP51 credential encryption, monitoring, and security audit information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  All GP51 API credentials are encrypted at rest and transmitted securely. 
                  Regular security audits and credential rotation schedules are monitored.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Credential Encryption</h4>
                    <p className="text-sm text-muted-foreground">
                      All stored GP51 credentials are encrypted using AES-256
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Session Security</h4>
                    <p className="text-sm text-muted-foreground">
                      GP51 sessions are validated and refreshed automatically
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Access Logging</h4>
                    <p className="text-sm text-muted-foreground">
                      All GP51 credential access and modifications are logged
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
                      Real-time monitoring of GP51 API connections for anomalies
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
                  <li>• Test GP51 connections regularly to ensure they remain active</li>
                  <li>• Monitor connection logs for unusual access patterns</li>
                  <li>• Use strong, unique passwords for all GP51 API accounts</li>
                  <li>• Keep GP51 API URLs and endpoints up to date</li>
                  <li>• Review session expiration settings periodically</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </TabsContent>
  );
};

export default GP51IntegrationTab;
