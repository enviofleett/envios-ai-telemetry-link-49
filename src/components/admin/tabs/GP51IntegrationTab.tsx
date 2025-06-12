
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GP51AuthenticationPanel } from '@/components/admin/GP51AuthenticationPanel';
import { GP51ConnectionTest } from '@/components/admin/GP51ConnectionTest';
import { GP51LiveImportModal } from '@/components/admin/GP51LiveImportModal';
import GP51Settings from '@/components/admin/GP51Settings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Activity, Settings, Zap, Download } from 'lucide-react';

const GP51IntegrationTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            GP51 Integration Management
          </CardTitle>
          <CardDescription>
            Secure authentication and management for GP51 telemetry service integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="authentication" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="authentication" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Authentication
              </TabsTrigger>
              <TabsTrigger value="connection" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Connection Test
              </TabsTrigger>
              <TabsTrigger value="import" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Live Import
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="legacy" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Legacy
              </TabsTrigger>
            </TabsList>

            <TabsContent value="authentication" className="space-y-4">
              <GP51AuthenticationPanel />
            </TabsContent>

            <TabsContent value="connection" className="space-y-4">
              <GP51ConnectionTest />
            </TabsContent>

            <TabsContent value="import" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Live Vehicle Data Import
                  </CardTitle>
                  <CardDescription>
                    Import live vehicle data from GP51 platform. Only actively reporting vehicles will be imported.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>• <strong>Live vehicles</strong> are those that have reported within your specified timeframe</p>
                    <p>• <strong>Configurable thresholds</strong> allow you to define what "live" means for your fleet</p>
                    <p>• <strong>Bulk import</strong> with progress tracking and error handling</p>
                    <p>• <strong>Smart filtering</strong> excludes offline or stale vehicle data</p>
                  </div>
                  
                  <GP51LiveImportModal />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <p>Advanced GP51 settings and configuration options will be available here.</p>
                <p className="text-sm mt-2">Features coming soon: Rate limiting, polling intervals, data sync settings</p>
              </div>
            </TabsContent>

            <TabsContent value="legacy" className="space-y-4">
              <GP51Settings />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default GP51IntegrationTab;
