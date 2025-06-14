
import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const AgentDashboardPage: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Agent Dashboard</h1>
        <Card>
          <CardHeader>
            <CardTitle>Welcome, Referral Agent!</CardTitle>
            <CardDescription>This is your personal dashboard where you can track your performance and earnings.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>More features like detailed analytics, commission history, and profile management are coming soon.</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AgentDashboardPage;
