
import React from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Navigation } from 'lucide-react';
import { LiveTrackingContent } from '@/components/tracking/LiveTrackingContent';

const LiveTracking: React.FC = () => {
  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Navigation className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Live Tracking</h1>
              <p className="text-sm text-muted-foreground">
                Real-time vehicle location monitoring and fleet tracking
              </p>
            </div>
          </div>
          
          <LiveTrackingContent />
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default LiveTracking;
