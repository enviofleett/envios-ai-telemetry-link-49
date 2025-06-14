
import React from 'react';
import Layout from '@/components/Layout';
import ReferredUsersTable from '@/components/packages/referral/agent/ReferredUsersTable';

const AgentReferredUsersPage: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Referred Users</h1>
        <p className="text-muted-foreground">
          Track the users who have joined through your referral codes and see their status.
        </p>
        <ReferredUsersTable />
      </div>
    </Layout>
  );
};

export default AgentReferredUsersPage;
