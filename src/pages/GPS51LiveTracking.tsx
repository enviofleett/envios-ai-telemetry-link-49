
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import GPS51LiveTrackingEnhanced from './GPS51LiveTrackingEnhanced';
import { useGPS51Integration } from '@/hooks/useGPS51Integration';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

const GPS51LiveTracking: React.FC = () => {
  const { user } = useAuth();
  const { isAuthenticated, isLoading, error, login } = useGPS51Integration();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading GPS51 Session</h3>
                <p className="text-gray-500">Please wait while we verify your GPS51 connection...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
                <h3 className="text-lg font-semibold text-red-600 mb-2">GPS51 Connection Error</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button 
                  onClick={() => window.location.href = '/gps51/setup'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Go to GPS51 Setup
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-4 text-amber-500" />
                <h2 className="text-xl font-semibold text-gray-700 mb-4">GPS51 Authentication Required</h2>
                <p className="text-gray-600 mb-4">Please authenticate with GPS51 first to access live tracking features.</p>
                <Button 
                  onClick={() => window.location.href = '/gps51/setup'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Go to GPS51 Setup →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <GPS51LiveTrackingEnhanced />
    </Layout>
  );
};

export default GPS51LiveTracking;
