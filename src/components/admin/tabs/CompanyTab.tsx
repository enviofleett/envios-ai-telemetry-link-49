
import React from 'react';
import CompanySettingsTab from '@/components/settings/CompanySettingsTab';

const CompanyTab: React.FC = () => {
  console.log('📋 [CompanyTab] Rendering company settings tab');
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Company Configuration</h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure your company information and organizational settings
        </p>
      </div>
      <CompanySettingsTab />
    </div>
  );
};

export default CompanyTab;
