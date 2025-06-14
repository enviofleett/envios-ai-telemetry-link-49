
import React from 'react';
import Layout from '@/components/Layout';
import AgentAnalyticsDashboard from '@/components/packages/referral/agent/AgentAnalyticsDashboard';

const AgentAnalyticsPage: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Performance Analytics</h1>
        <p className="text-muted-foreground">
          Track your referral performance and growth over time.
        </p>
        <AgentAnalyticsDashboard />
      </div>
    </Layout>
  );
};

export default AgentAnalyticsPage;
