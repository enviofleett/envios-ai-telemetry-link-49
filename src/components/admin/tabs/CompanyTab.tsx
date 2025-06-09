
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import CompanySettingsTab from '@/components/settings/CompanySettingsTab';

const CompanyTab: React.FC = () => {
  return (
    <TabsContent value="company" className="space-y-4 mt-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Company Settings</h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure your company information and fleet management settings
        </p>
      </div>
      <CompanySettingsTab />
    </TabsContent>
  );
};

export default CompanyTab;
