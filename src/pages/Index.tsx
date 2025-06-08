
import React from 'react';
import { Layout } from '@/components/Layout';
import { UnifiedDashboard } from '@/components/UnifiedDashboard';
import { PerformanceWidget } from '@/components/performance/PerformanceWidget';

const Index = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="w-80">
            <PerformanceWidget />
          </div>
        </div>
        <UnifiedDashboard />
      </div>
    </Layout>
  );
};

export default Index;
