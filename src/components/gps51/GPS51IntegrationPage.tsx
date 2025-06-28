
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import GPS51AuthenticationForm from './GPS51AuthenticationForm';
import FleetManagementPage from './FleetManagementPage';
import { useGPS51Integration } from '@/hooks/useGPS51Integration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Car, BarChart3, LayoutDashboard, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const GPS51IntegrationPage: React.FC = () => {
  const { user } = useAuth();
  const { 
    isAuthenticated, 
    isLoading, 
    error, 
    securityStats, 
    refreshSecurityStats,
    testConnection 
  } = useGPS51Integration();

  // Refresh security stats on mount
  useEffect(() => {
    if (isAuthenticated) {
      refreshSecurityStats();
    }
  }, [isAuthenticated, refreshSecurityStats]);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleRefreshStats = async () => {
    await refreshSecurityStats();
  };

  const handleTestConnection = async () => {
    await testConnection();
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">GPS51 Integration</h1>
            <p className="text-gray-400">Manage your GPS51 fleet tracking integration and monitor your vehicles in real-time</p>
            
            {/* Connection Status */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                {isAuthenticated ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-green-400 font-medium">Connected</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <span className="text-red-400 font-medium">Disconnected</span>
                  </>
                )}
              </div>
              
              {isAuthenticated && (
                <Badge variant="outline" className="border-green-600 text-green-400">
                  Security Level: {securityStats.securityLevel.toUpperCase()}
                </Badge>
              )}
            </div>
          </div>
          
          {isAuthenticated && (
            <div className="flex gap-2">
              <Button
                onClick={handleTestConnection}
                disabled={isLoading}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                Test Connection
              </Button>
              
              <Link to="/gps51/dashboard">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Open GPS51 Dashboard
                </Button>
              </Link>
            </div>
          )}
        </div>

        <Tabs defaultValue="authentication" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
            <TabsTrigger value="authentication" className="flex items-center gap-2 data-[state=active]:bg-gray-700">
              <Shield className="h-4 w-4" />
              Authentication
            </TabsTrigger>
            <TabsTrigger value="fleet" className="flex items-center gap-2 data-[state=active]:bg-gray-700" disabled={!isAuthenticated}>
              <Car className="h-4 w-4" />
              Fleet Management
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-gray-700" disabled={!isAuthenticated}>
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="authentication" className="space-y-6">
            <GPS51AuthenticationForm />
            
            {/* Security Stats */}
            {isAuthenticated && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-white">Security Statistics</CardTitle>
                  <Button
                    onClick={handleRefreshStats}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-white">{securityStats.totalConnections}</div>
                      <div className="text-sm text-gray-400">Total Connections</div>
                    </div>
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-white">{securityStats.failedAttempts}</div>
                      <div className="text-sm text-gray-400">Failed Attempts</div>
                    </div>
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-white">{securityStats.totalEvents}</div>
                      <div className="text-sm text-gray-400">Total Events</div>
                    </div>
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-white">{securityStats.recentFailedAttempts}</div>
                      <div className="text-sm text-gray-400">Recent Failed</div>
                    </div>
                  </div>
                  
                  {securityStats.lastSuccessfulConnection && (
                    <div className="mt-4 text-sm text-gray-400">
                      Last successful connection: {securityStats.lastSuccessfulConnection.toLocaleString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {!isAuthenticated && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Getting Started</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm text-gray-300">
                    <p>To get started with GPS51 integration:</p>
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Enter your GPS51 username and password above</li>
                      <li>Click "Connect to GPS51" to authenticate</li>
                      <li>Your session will persist across page refreshes</li>
                      <li>Access fleet management and analytics once connected</li>
                      <li>Visit the GPS51 Dashboard for full platform access</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            )}

            {isAuthenticated && (
              <Card className="bg-green-900/20 border-green-700">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-green-400">GPS51 Connected Successfully!</h3>
                      <p className="text-sm text-green-300">
                        Your connection is secure and will persist across browser sessions.
                      </p>
                    </div>
                    <Link to="/gps51/dashboard">
                      <Button className="bg-green-600 hover:bg-green-700">
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Open Dashboard
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="fleet" className="space-y-6">
            {isAuthenticated ? (
              <FleetManagementPage />
            ) : (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-6">
                  <div className="text-center text-gray-400">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                    <p>Please authenticate with GPS51 first to access fleet management features.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {isAuthenticated ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Fleet Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-gray-400 py-8">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                    <p>Advanced analytics dashboard coming soon...</p>
                    <div className="mt-4">
                      <Link to="/gps51/analytics">
                        <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                          Visit GPS51 Analytics
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-6">
                  <div className="text-center text-gray-400">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                    <p>Please authenticate with GPS51 first to access analytics.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default GPS51IntegrationPage;
