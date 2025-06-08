
import React from 'react';
import Layout from '@/components/Layout';
import UnifiedDashboard from '@/components/UnifiedDashboard';
import { PerformanceWidget } from '@/components/performance/PerformanceWidget';
import { useGP51Auth } from '@/contexts/GP51AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Wifi, WifiOff, AlertTriangle } from 'lucide-react';

const Index = () => {
  const { signOut, user, authLevel } = useGP51Auth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getStatusIcon = () => {
    switch (authLevel) {
      case 'full': return <Wifi className="h-4 w-4 text-green-500" />;
      case 'degraded': return <Wifi className="h-4 w-4 text-yellow-500" />;
      case 'minimal': return <WifiOff className="h-4 w-4 text-orange-500" />;
      case 'offline': return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (authLevel) {
      case 'full': return 'GP51 Connected';
      case 'degraded': return 'GP51 Degraded';
      case 'minimal': return 'Local Mode';
      case 'offline': return 'Offline';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">GP51 Fleet Dashboard</h1>
            {user && (
              <div className="flex items-center gap-4 mt-1">
                <p className="text-sm text-gray-600">
                  Welcome back, {user.user_metadata?.gp51_username || user.email}
                </p>
                <div className="flex items-center gap-1">
                  {getStatusIcon()}
                  <span className="text-xs font-medium">
                    {getStatusText()}
                  </span>
                </div>
              </div>
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
