
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plug, TestTube, Settings, Database, RefreshCw } from 'lucide-react';

const GP51IntegrationTab: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [autoSync, setAutoSync] = useState(true);

  const connectionSettings = {
    apiUrl: 'https://api.gps51.com',
    username: 'fleet_admin',
    lastSync: '2024-01-15 14:30:00',
    syncInterval: 30
  };

  const syncStats = {
    totalVehicles: 45,
    lastSyncVehicles: 42,
    errors: 3,
    successRate: 93.3
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5" />
            GP51 Integration
          </CardTitle>
          <CardDescription>
            Configure and manage GP51 platform integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="connection" className="space-y-4">
            <TabsList>
              <TabsTrigger value="connection">Connection</TabsTrigger>
              <TabsTrigger value="sync">Data Sync</TabsTrigger>
              <TabsTrigger value="testing">Testing</TabsTrigger>
            </TabsList>

            <TabsContent value="connection" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Connection Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Status</span>
                      <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
                        {connectionStatus}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>API URL</span>
                      <span className="text-sm text-muted-foreground">{connectionSettings.apiUrl}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Username</span>
                      <span className="text-sm text-muted-foreground">{connectionSettings.username}</span>
                    </div>
                    <Button className="w-full">
                      <TestTube className="h-4 w-4 mr-2" />
                      Test Connection
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="gp51-url">GP51 API URL</Label>
                      <Input
                        id="gp51-url"
                        value={connectionSettings.apiUrl}
                        placeholder="https://api.gps51.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gp51-username">Username</Label>
                      <Input
                        id="gp51-username"
                        value={connectionSettings.username}
                        placeholder="Enter GP51 username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gp51-password">Password</Label>
                      <Input
                        id="gp51-password"
                        type="password"
                        placeholder="Enter GP51 password"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="sync" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Sync Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="auto-sync">Auto Sync</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically sync data at regular intervals
                        </p>
                      </div>
                      <Switch
                        id="auto-sync"
                        checked={autoSync}
                        onCheckedChange={setAutoSync}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sync-interval">Sync Interval (minutes)</Label>
                      <Input
                        id="sync-interval"
                        type="number"
                        value={connectionSettings.syncInterval}
                        placeholder="30"
                      />
                    </div>
                    <Button className="w-full">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Force Sync Now
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Sync Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Total Vehicles</span>
                        <span className="font-medium">{syncStats.totalVehicles}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Sync</span>
                        <span className="font-medium">{syncStats.lastSyncVehicles}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Errors</span>
                        <span className="font-medium text-red-600">{syncStats.errors}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Success Rate</span>
                        <span className="font-medium text-green-600">{syncStats.successRate}%</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Last sync: {connectionSettings.lastSync}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="testing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Integration Testing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button variant="outline" className="h-20 flex-col">
                      <TestTube className="h-6 w-6 mb-2" />
                      Test Authentication
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <Database className="h-6 w-6 mb-2" />
                      Test Data Fetch
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <RefreshCw className="h-6 w-6 mb-2" />
                      Test Full Sync
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Run these tests to verify your GP51 integration is working correctly.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default GP51IntegrationTab;
