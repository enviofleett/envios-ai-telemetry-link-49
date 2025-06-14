
import React from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Users } from 'lucide-react';
import ReferralAgentManager from '@/components/packages/referral/agent/ReferralAgentManager';

const ReferralAgentManagementPage: React.FC = () => {
  return (
    <ProtectedRoute requireAdmin>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Referral Agent Management</h1>
              <p className="text-sm text-muted-foreground">
                Approve, manage, and track referral agents.
              </p>
            </div>
          </div>
          <ReferralAgentManager />
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default ReferralAgentManagementPage;
