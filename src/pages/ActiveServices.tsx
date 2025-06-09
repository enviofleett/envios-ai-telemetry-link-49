
import React from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { CreditCard } from 'lucide-react';
import ActiveServicesManagement from '@/components/services/ActiveServicesManagement';

const ActiveServices: React.FC = () => {
  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Active Services</h1>
              <p className="text-sm text-muted-foreground">
                Manage your active subscriptions, billing, and service configurations
              </p>
            </div>
          </div>
          
          <ActiveServicesManagement />
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default ActiveServices;
