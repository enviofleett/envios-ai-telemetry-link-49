
import React from 'react';
import Layout from '@/components/Layout';
import AgentReferralCodeManager from '@/components/packages/referral/agent/AgentReferralCodeManager';

const AgentReferralCodesPage: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Referral Codes</h1>
        <p className="text-muted-foreground">
          Manage your unique referral codes to share with potential customers.
        </p>
        <AgentReferralCodeManager />
      </div>
    </Layout>
  );
};

export default AgentReferralCodesPage;
