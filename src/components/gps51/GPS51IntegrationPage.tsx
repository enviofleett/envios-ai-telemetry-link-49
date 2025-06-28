
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import GPS51AuthenticationForm from './GPS51AuthenticationForm';
import FleetManagementPage from './FleetManagementPage';
import { useGPS51Integration } from '@/hooks/useGPS51Integration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Car, BarChart3 } from 'lucide-react';

const GPS51IntegrationPage: React.FC = () => {
  const { user } = useAuth();
  const { isAuthenticated } = useGPS51Integration();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">GPS51 Integration</h1>
          <p className="text-gray-600">Manage your GPS51 fleet tracking integration and monitor your vehicles in real-time</p>
        </div>

        <Tabs defaultValue="authentication" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="authentication" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Authentication
            </TabsTrigger>
            <TabsTrigger value="fleet" className="flex items-center gap-2" disabled={!isAuthenticated}>
              <Car className="h-4 w-4" />
              Fleet Management
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2" disabled={!isAuthenticated}>
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="authentication" className="space-y-6">
            <GPS51AuthenticationForm />
            
            {!isAuthenticated && (
              <Card>
                <CardHeader>
                  <CardTitle>Getting Started</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm text-gray-600">
                    <p>To get started with GPS51 integration:</p>
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Enter your GPS51 username and password above</li>
                      <li>Click "Connect to GPS51" to authenticate</li>
                      <li>Once connected, you can access fleet management and analytics</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="fleet" className="space-y-6">
            {isAuthenticated ? (
              <FleetManagementPage />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-gray-500">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Please authenticate with GPS51 first to access fleet management features.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {isAuthenticated ? (
              <Card>
                <CardHeader>
                  <CardTitle>Fleet Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-gray-500 py-8">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Analytics dashboard coming soon...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-gray-500">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
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
