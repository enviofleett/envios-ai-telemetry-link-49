
import React from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import WorkshopAnalyticsDashboard from '@/components/workshops/analytics/WorkshopAnalyticsDashboard';
import WorkshopReviewSystem from '@/components/workshops/reviews/WorkshopReviewSystem';
import MobileResponsiveLayout from '@/components/common/MobileResponsiveLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BarChart3, Star, Download, Settings, Home, TrendingUp } from 'lucide-react';
import { useEnhancedWorkshopManagement } from '@/hooks/useEnhancedWorkshopManagement';

const WorkshopAnalytics: React.FC = () => {
  // Mock workshop ID - in real app, this would come from route params or context
  const workshopId = 'workshop-123';
  
  const {
    hasPermission,
    hasRole,
    canManageSettings,
    canViewTransactions
  } = useEnhancedWorkshopManagement(workshopId);

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home className="h-4 w-4" />,
      href: '/workshop-management'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="h-4 w-4" />,
      children: [
        { id: 'overview', label: 'Overview', href: '/workshop-analytics' },
        { id: 'performance', label: 'Performance', href: '/workshop-analytics?tab=performance' },
        { id: 'financial', label: 'Financial', href: '/workshop-analytics?tab=financial' }
      ]
    },
    {
      id: 'reviews',
      label: 'Reviews',
      icon: <Star className="h-4 w-4" />,
      href: '/workshop-analytics?tab=reviews'
    }
  ];

  const headerContent = (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="sm">
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
      <Button variant="outline" size="sm">
        <Settings className="h-4 w-4 mr-2" />
        Settings
      </Button>
    </div>
  );

  return (
    <ProtectedRoute>
      <Layout>
        <MobileResponsiveLayout
          title="Workshop Analytics"
          navigationItems={navigationItems}
          headerContent={headerContent}
        >
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Workshop Analytics</h1>
                <p className="text-sm text-muted-foreground">
                  Comprehensive performance insights and reporting
                </p>
              </div>
            </div>

            <Tabs defaultValue="analytics" className="w-full">
              <TabsList className="grid grid-cols-2 w-full max-w-md">
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="analytics" className="mt-6">
                <WorkshopAnalyticsDashboard workshopId={workshopId} />
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <WorkshopReviewSystem 
                  workshopId={workshopId} 
                  canRespond={canManageSettings}
                />
              </TabsContent>
            </Tabs>
          </div>
        </MobileResponsiveLayout>
      </Layout>
    </ProtectedRoute>
  );
};

export default WorkshopAnalytics;
