
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GP51CredentialsForm } from '@/components/gp51/GP51CredentialsForm';
import { GP51DeviceList } from '@/components/gp51/GP51DeviceList';
import { GP51StatusIndicator } from '@/components/gp51/GP51StatusIndicator';
import { SessionSecurityIndicator } from '@/components/security/SessionSecurityIndicator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  CheckCircle, 
  Settings, 
  Activity,
  Globe,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { GP51TroubleshootingGuide } from '@/components/gp51/GP51TroubleshootingGuide';
import { GP51Documentation } from '@/components/gp51/GP51Documentation';

export const GP51IntegrationTab: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            GP51 API Integration
          </h2>
          <p className="text-muted-foreground">
            🌐 Centralized GP51 tracking system connection with enhanced security
          </p>
        </div>
      </div>

      <Tabs defaultValue="connection" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
          <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
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

          <GP51CredentialsForm onConnectionChange={setIsConnected} />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SessionSecurityIndicator />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  🔒 Enhanced Security Features
                </CardTitle>
                <CardDescription>
                  Advanced session protection and security monitoring
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Session Encryption</h4>
                      <p className="text-sm text-muted-foreground">
                        GP51 tokens encrypted with AES-256-GCM
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Device Fingerprinting</h4>
                      <p className="text-sm text-muted-foreground">
                        Browser and device characteristics validation
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Session Validation</h4>
                      <p className="text-sm text-muted-foreground">
                        Continuous security checks every 5 minutes
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Auto Session Renewal</h4>
                      <p className="text-sm text-muted-foreground">
                        Automatic token refresh before expiry
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Concurrent Session Limiting</h4>
                      <p className="text-sm text-muted-foreground">
                        Maximum 3 active sessions per user
                      </p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">
                      <Settings className="h-3 w-3 mr-1" />
                      Configured
                    </Badge>
                  </div>
                </div>

                <Alert>
                  <ShieldCheck className="h-4 w-4" />
                  <AlertDescription>
                    Enhanced security features provide multi-layer protection including 
                    encryption, fingerprinting, anomaly detection, and automatic threat response.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
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
                    Please establish a secure GP51 connection first to view and manage your devices.
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

        <TabsContent value="access" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                🛡️ Access Control & Audit
              </CardTitle>
              <CardDescription>
                Session access control and security audit information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  All GP51 session access is monitored and logged. Enhanced security features 
                  include risk assessment, anomaly detection, and automated threat response.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Security Audit Logging</h4>
                    <p className="text-sm text-muted-foreground">
                      All session activities and security events are logged
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Anomaly Detection</h4>
                    <p className="text-sm text-muted-foreground">
                      Behavioral analysis and suspicious activity detection
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Risk-based Authentication</h4>
                    <p className="text-sm text-muted-foreground">
                      Dynamic security challenges based on risk level
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Session Termination Protection</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatic session termination on security threats
                    </p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    <Settings className="h-3 w-3 mr-1" />
                    Configured
                  </Badge>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h5 className="font-medium mb-2">Enhanced Security Recommendations</h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Monitor session security indicators regularly</li>
                  <li>• Review security audit logs for unusual activity</li>
                  <li>• Keep browser and device security up to date</li>
                  <li>• Use secure networks for GP51 access</li>
                  <li>• Report any suspicious session behavior immediately</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="troubleshooting" className="space-y-6">
          <GP51TroubleshootingGuide />
        </TabsContent>

        <TabsContent value="documentation" className="space-y-6">
          <GP51Documentation />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GP51IntegrationTab;
