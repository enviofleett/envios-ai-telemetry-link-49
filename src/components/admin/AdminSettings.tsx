
import React, { useState } from 'react';
import MobileResponsiveAdminLayout from './MobileResponsiveAdminLayout';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('packages');

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Admin Settings</h1>
      </div>

      <MobileResponsiveAdminLayout 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
    </div>
  );
}
