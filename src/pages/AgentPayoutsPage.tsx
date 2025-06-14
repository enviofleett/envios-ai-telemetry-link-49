
import React from 'react';
import Layout from '@/components/Layout';
import AgentPayoutsTable from '@/components/packages/referral/agent/AgentPayoutsTable';

const AgentPayoutsPage: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Payout History</h1>
        <p className="text-muted-foreground">
          Track the status of your payout requests.
        </p>
        <AgentPayoutsTable />
      </div>
    </Layout>
  );
};

export default AgentPayoutsPage;
