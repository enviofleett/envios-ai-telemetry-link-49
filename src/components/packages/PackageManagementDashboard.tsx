
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PackageList from './PackageList';
import CreatePackageForm from './CreatePackageForm';
import FeatureManagement from './FeatureManagement';
import ReferralCodeManager from './ReferralCodeManager';

const PackageManagementDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('packages');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="create">Create Package</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="referrals">Referral Codes</TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="space-y-6">
          <PackageList />
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <CreatePackageForm onSuccess={() => setActiveTab('packages')} />
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <FeatureManagement />
        </TabsContent>

        <TabsContent value="referrals" className="space-y-6">
          <ReferralCodeManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PackageManagementDashboard;
