
import React from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation } from 'lucide-react';

const LiveTracking: React.FC = () => {
  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Navigation className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Live Tracking</h1>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Real-time Vehicle Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Live tracking functionality will be implemented here.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default LiveTracking;
