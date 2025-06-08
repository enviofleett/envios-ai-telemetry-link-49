
import React from 'react';
import Layout from '@/components/Layout';
import UnifiedDashboard from '@/components/UnifiedDashboard';
import { PerformanceWidget } from '@/components/performance/PerformanceWidget';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

const Index = () => {
  const { signOut, user } = useAuth();

  console.log('🏠 Index (Dashboard): Component rendered');
  console.log('🏠 Index (Dashboard): User:', user?.email || 'none');
  console.log('🏠 Index (Dashboard): Current URL:', window.location.href);

  const handleSignOut = async () => {
    console.log('🚪 Index: Sign out initiated');
    try {
      await signOut();
      console.log('✅ Index: Sign out successful');
    } catch (error) {
      console.error('❌ Index: Sign out error:', error);
    }
  };

  console.log('🏠 Index: Rendering dashboard layout');

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            {user && (
              <p className="text-sm text-gray-600 mt-1">
                Welcome back, {user.email}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="w-80">
              <PerformanceWidget />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
        <UnifiedDashboard />
      </div>
    </Layout>
  );
};

export default Index;
