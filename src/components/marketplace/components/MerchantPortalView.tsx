
// Import your real MerchantDashboard here (already exists)

import React from 'react';
import { Button } from "@/components/ui/button";
import { MerchantDashboard } from '../MerchantDashboard';

interface MerchantPortalViewProps {
  onSwitchRole: () => void;
}

export const MerchantPortalView: React.FC<MerchantPortalViewProps> = ({ onSwitchRole }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Merchant Portal</h1>
        <p className="text-muted-foreground">
          Manage your products and track your business performance
        </p>
      </div>
      <Button variant="outline" onClick={onSwitchRole}>
        Switch to Customer View
      </Button>
    </div>
    <MerchantDashboard />
  </div>
);
