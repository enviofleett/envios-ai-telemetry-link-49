
import React from 'react';
import PackageManagementDashboard from '@/components/packages/PackageManagementDashboard';

const PackagesTab: React.FC = () => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Package Management</h3>
        <p className="text-sm text-gray-600 mb-4">
          Create, manage, and configure subscription packages for your fleet management system
        </p>
      </div>
      <PackageManagementDashboard />
    </div>
  );
};

export default PackagesTab;
