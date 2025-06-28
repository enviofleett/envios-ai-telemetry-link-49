
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Shield } from 'lucide-react';
import { useGPS51Integration } from '@/hooks/useGPS51Integration';

const GPS51Reports: React.FC = () => {
  const { user } = useAuth();
  const { isAuthenticated } = useGPS51Integration();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">GPS51 Reports</h1>
          <p className="text-gray-600">Generate detailed fleet reports and analytics</p>
        </div>

        {!isAuthenticated ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Please authenticate with GPS51 first to generate reports.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Report Generation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Advanced reporting features coming soon...</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default GPS51Reports;
