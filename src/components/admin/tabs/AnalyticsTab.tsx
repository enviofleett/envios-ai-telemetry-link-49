
import React, { useState, Suspense, lazy } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3 } from 'lucide-react';

// Lazy load package analytics sub-components
const PackageSubscriptionChart = lazy(() => import('@/components/analytics/PackageSubscriptionChart'));
const RevenueAnalyticsChart = lazy(() => import('@/components/analytics/RevenueAnalyticsChart'));
const FeatureUsageMatrix = lazy(() => import('@/components/analytics/FeatureUsageMatrix'));
const ReferralCodePerformance = lazy(() => import('@/components/analytics/ReferralCodePerformance'));

const AnalyticsTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics Dashboard
              </CardTitle>
              <CardDescription>
                System usage analytics and performance metrics
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="packages">Packages</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <p>Analytics service is being rebuilt. Data will be available soon.</p>
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <p>User analytics data will be available once the service is restored.</p>
              </div>
            </TabsContent>

            <TabsContent value="system" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <p>System metrics will be available once the service is restored.</p>
              </div>
            </TabsContent>

            <TabsContent value="packages" className="space-y-6">
              <Suspense fallback={<div className="text-center py-6 text-muted-foreground">Loading package analytics...</div>}>
                <div className="grid md:grid-cols-2 gap-6">
                  <PackageSubscriptionChart />
                  <RevenueAnalyticsChart />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <FeatureUsageMatrix />
                  <ReferralCodePerformance />
                </div>
              </Suspense>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsTab;
