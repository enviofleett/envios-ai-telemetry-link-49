
import React, { useState, memo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminSettingsLayout from './AdminSettingsLayout';

const OptimizedAdminSettings: React.FC = memo(() => {
  const [activeTab, setActiveTab] = useState('company');
  const { isCheckingRole } = useAuth();

  // Memoize tab change handler to prevent recreation on every render
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  // Show loading state if still checking role
  if (isCheckingRole) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              Verifying admin access...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminSettingsLayout 
      activeTab={activeTab} 
      onTabChange={handleTabChange} 
    />
  );
});

OptimizedAdminSettings.displayName = 'OptimizedAdminSettings';

export default OptimizedAdminSettings;
