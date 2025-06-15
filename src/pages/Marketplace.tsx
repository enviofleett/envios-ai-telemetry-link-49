import React from 'react';
import Layout from '@/components/Layout';
import { EnhancedMarketplace } from '@/components/marketplace/EnhancedMarketplace';
import MarketplaceAuthGuard from '@/components/marketplace/security/MarketplaceAuthGuard';

const Marketplace: React.FC = () => {
  return (
    <MarketplaceAuthGuard>
      <Layout>
        <EnhancedMarketplace />
      </Layout>
    </MarketplaceAuthGuard>
  );
};

export default Marketplace;
