
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Zap, Settings, Activity } from 'lucide-react';
import { useGPS51Integration } from '@/hooks/useGPS51Integration';
import GPS51AuthenticationForm from './GPS51AuthenticationForm';
import GPS51MD5TestPanel from './GPS51MD5TestPanel';
import GPS51SecurityDashboard from './GPS51SecurityDashboard';
import GPS51ConnectionStatus from './GPS51ConnectionStatus';

const GPS51IntegrationPage: React.FC = () => {
  const {
    isAuthenticated,
    isLoading,
    error,
    md5TestResults,
    securityStats,
    refreshSecurityStats,
    runMD5Tests
  } = useGPS51Integration();

  useEffect(() => {
    // Run initial MD5 tests and refresh security stats
    runMD5Tests();
    refreshSecurityStats();
  }, [runMD5Tests, refreshSecurityStats]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
            <Zap className="h-10 w-10 text-blue-400" />
            GPS51 Fleet Integration
          </h1>
          <p className="text-gray-400 text-lg">
            Secure fleet tracking integration with advanced security monitoring
          </p>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Connection</p>
                  <Badge variant={isAuthenticated ? "default" : "destructive"} className="mt-1">
                    {isAuthenticated ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
                <Activity className={`h-8 w-8 ${isAuthenticated ? 'text-green-400' : 'text-red-400'}`} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">MD5 Tests</p>
                  <Badge variant={md5TestResults?.summary.passed ? "default" : "destructive"} className="mt-1">
                    {md5TestResults?.summary.passed ? "All Passed" : "Failed"}
                  </Badge>
                </div>
                <Shield className={`h-8 w-8 ${md5TestResults?.summary.passed ? 'text-green-400' : 'text-red-400'}`} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Security</p>
                  <Badge variant={securityStats?.lockedAccounts > 0 ? "destructive" : "default"} className="mt-1">
                    {securityStats?.lockedAccounts || 0} Locked
                  </Badge>
                </div>
                <Shield className={`h-8 w-8 ${securityStats?.lockedAccounts > 0 ? 'text-red-400' : 'text-green-400'}`} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <Badge variant={isLoading ? "secondary" : "outline"} className="mt-1">
                    {isLoading ? "Processing" : "Ready"}
                  </Badge>
                </div>
                <Settings className={`h-8 w-8 ${isLoading ? 'text-yellow-400 animate-spin' : 'text-blue-400'}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="bg-red-900/20 border-red-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-400">
                <Shield className="h-5 w-5" />
                <span className="font-medium">Error:</span>
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="connection" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full bg-gray-800 border-gray-700">
            <TabsTrigger value="connection" className="data-[state=active]:bg-blue-600">
              Connection
            </TabsTrigger>
            <TabsTrigger value="md5" className="data-[state=active]:bg-blue-600">
              MD5 Testing
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-blue-600">
              Security
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connection" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GPS51ConnectionStatus />
              <GPS51AuthenticationForm />
            </div>
          </TabsContent>

          <TabsContent value="md5" className="space-y-6">
            <GPS51MD5TestPanel />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <GPS51SecurityDashboard />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Configuration Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Advanced configuration options will be available here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GPS51IntegrationPage;
