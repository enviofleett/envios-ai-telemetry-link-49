
import React, { useState, useEffect } from 'react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProgressiveAdminLoaderProps {
  children: React.ReactNode;
}

const AdminLoadingSkeleton = () => (
  <div className="container mx-auto py-6 space-y-6">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-32" />
    </div>
    
    <Card className="p-6">
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    </Card>
    
    <Card className="p-6">
      <Skeleton className="h-64" />
    </Card>
  </div>
);

const AdminAccessDenied = ({ userRole, onRetry, isStale }: { 
  userRole: string | null; 
  onRetry: () => void;
  isStale: boolean;
}) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Card className="p-8 max-w-md mx-auto text-center">
      <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
      <h2 className="text-lg font-semibold mb-2">Admin Access Required</h2>
      <p className="text-muted-foreground mb-4">
        You need administrator privileges to access admin settings.
      </p>
      <p className="text-sm text-muted-foreground mb-6">
        Current role: {userRole || 'Unknown'}
        {isStale && ' (checking for updates...)'}
      </p>
      <Button onClick={onRetry} variant="outline" className="w-full">
        <RefreshCw className="h-4 w-4 mr-2" />
        Check Access Again
      </Button>
    </Card>
  </div>
);

export const ProgressiveAdminLoader: React.FC<ProgressiveAdminLoaderProps> = ({ children }) => {
  const auth = useOptimizedAuth();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Show content immediately if we have cached admin access
    if (!auth.loading && auth.isAdmin) {
      setShowContent(true);
    }
  }, [auth.loading, auth.isAdmin]);

  // Show skeleton while loading initial data
  if (auth.loading && !auth.isStale) {
    return <AdminLoadingSkeleton />;
  }

  // Show access denied if not admin
  if (!auth.loading && !auth.isAdmin) {
    return (
      <AdminAccessDenied 
        userRole={auth.userRole} 
        onRetry={auth.retryRoleCheck}
        isStale={auth.isStale}
      />
    );
  }

  // Show content with progressive enhancement
  if (showContent || (!auth.loading && auth.isAdmin)) {
    return (
      <div className="relative">
        {auth.isStale && (
          <div className="fixed top-4 right-4 z-50">
            <Card className="p-2 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Updating...
              </div>
            </Card>
          </div>
        )}
        {children}
      </div>
    );
  }

  return <AdminLoadingSkeleton />;
};
