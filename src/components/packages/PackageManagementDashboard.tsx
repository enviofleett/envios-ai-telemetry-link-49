
import React, { useState, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StableErrorBoundary } from '@/components/StableErrorBoundary';

const PackageList = React.lazy(() => import('./PackageList'));
const CreatePackageForm = React.lazy(() => import('./CreatePackageForm'));
const FeatureManagement = React.lazy(() => import('./FeatureManagement'));
const ReferralCodeManager = React.lazy(() => import('./ReferralCodeManager'));

const TabLoader = () => (
  <div className="flex items-center justify-center p-10 min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

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
          <StableErrorBoundary>
            <Suspense fallback={<TabLoader />}>
              <PackageList />
            </Suspense>
          </StableErrorBoundary>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <StableErrorBoundary>
            <Suspense fallback={<TabLoader />}>
              <CreatePackageForm onSuccess={() => setActiveTab('packages')} />
            </Suspense>
          </StableErrorBoundary>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <StableErrorBoundary>
            <Suspense fallback={<TabLoader />}>
              <FeatureManagement />
            </Suspense>
          </StableErrorBoundary>
        </TabsContent>

        <TabsContent value="referrals" className="space-y-6">
          <StableErrorBoundary>
            <Suspense fallback={<TabLoader />}>
              <ReferralCodeManager />
            </Suspense>
          </StableErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PackageManagementDashboard;
