
import React, { useState } from 'react';
import AdminSettingsLayout from './AdminSettingsLayout';

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('packages');

  return (
    <AdminSettingsLayout 
      activeTab={activeTab} 
      onTabChange={setActiveTab} 
    />
  );
};

export default AdminSettings;
