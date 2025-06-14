
import React from 'react';
import Layout from '@/components/Layout';
import CommissionHistoryTable from '@/components/packages/referral/agent/CommissionHistoryTable';

const AgentCommissionsPage: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Commission History</h1>
        <p className="text-muted-foreground">
          Review your earnings and track the status of your commission payouts.
        </p>
        <CommissionHistoryTable />
      </div>
    </Layout>
  );
};

export default AgentCommissionsPage;
