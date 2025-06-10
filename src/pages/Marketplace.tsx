
import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';

const Marketplace: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Fleet Management Marketplace
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Marketplace features will be available here. This includes vehicle parts, 
              service providers, and fleet management tools.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Marketplace;
