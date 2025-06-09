
import React from 'react';
import CompanySettingsTab from '@/components/settings/CompanySettingsTab';

const CompanyTab: React.FC = () => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Company Settings</h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure your company information and fleet management settings
        </p>
      </div>
      <CompanySettingsTab />
    </div>
  );
};

export default CompanyTab;
