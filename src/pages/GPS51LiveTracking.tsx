
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Activity, Clock, Zap } from 'lucide-react';
import FleetManagementPage from '@/components/gps51/FleetManagementPage';
import { useGPS51Integration } from '@/hooks/useGPS51Integration';

const GPS51LiveTracking: React.FC = () => {
  const { user } = useAuth();
  const { isAuthenticated } = useGPS51Integration();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Please authenticate with GPS51 first to access live tracking features.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Vehicle Tracking</h1>
          <p className="text-gray-600">Real-time GPS51 fleet monitoring and vehicle status</p>
        </div>
        <FleetManagementPage />
      </div>
    </Layout>
  );
};

export default GPS51LiveTracking;
