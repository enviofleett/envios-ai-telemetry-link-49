
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminSettingsLayout from './AdminSettingsLayout';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('packages');
  const { user, isAdmin, userRole, isCheckingRole } = useAuth();

  useEffect(() => {
    console.log('🔍 AdminSettings component mounted');
    console.log('👤 User:', user?.email);
    console.log('🔐 Is Admin:', isAdmin);
    console.log('📋 User Role:', userRole);
    console.log('⏳ Is Checking Role:', isCheckingRole);
  }, [user, isAdmin, userRole, isCheckingRole]);

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
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Admin Settings</h1>
        <div className="text-xs text-muted-foreground">
          Logged in as: {user?.email} ({userRole})
        </div>
      </div>

      <AdminSettingsLayout 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
    </div>
  );
}
