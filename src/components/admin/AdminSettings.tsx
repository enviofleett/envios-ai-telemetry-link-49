
import React, { useState, useEffect, memo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminSettingsLayout from './AdminSettingsLayout';

const AdminSettings: React.FC = memo(() => {
  const [activeTab, setActiveTab] = useState('company');
  const { user, isAdmin, userRole, isCheckingRole } = useAuth();

  useEffect(() => {
    console.log('🔍 AdminSettings component mounted');
    console.log('👤 User:', user?.email);
    console.log('🔐 Is Admin:', isAdmin);
    console.log('📋 User Role:', userRole);
    console.log('⏳ Is Checking Role:', isCheckingRole);
  }, [user, isAdmin, userRole, isCheckingRole]);

  // Memoize tab change handler
  const handleTabChange = React.useCallback((tab: string) => {
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
              Loading admin settings...
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

AdminSettings.displayName = 'AdminSettings';

export default AdminSettings;
