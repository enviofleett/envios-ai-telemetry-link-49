
import React from 'react';
import Layout from '@/components/Layout';
import MarketplaceAnalyticsTab from '@/components/admin/tabs/MarketplaceAnalyticsTab';
import { BarChart3 } from 'lucide-react';

const AdminAnalytics: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <BarChart3 className="h-8 w-8" />
                Marketplace Analytics
            </h1>
        </div>
        <p className="text-muted-foreground">
          Detailed insights into marketplace performance, sales, and trends.
        </p>
        <MarketplaceAnalyticsTab />
      </div>
    </Layout>
  );
};

export default AdminAnalytics;
