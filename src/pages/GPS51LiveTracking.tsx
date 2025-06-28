
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import GPS51LiveTrackingEnhanced from './GPS51LiveTrackingEnhanced';
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
          <div className="text-center text-gray-500 bg-gray-800 rounded-lg p-8">
            <h2 className="text-xl font-semibold text-gray-300 mb-4">GPS51 Authentication Required</h2>
            <p className="text-gray-400 mb-4">Please authenticate with GPS51 first to access live tracking features.</p>
            <a 
              href="/gps51/setup" 
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Go to GPS51 Setup →
            </a>
          </div>
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
