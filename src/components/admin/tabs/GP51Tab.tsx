
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import EnhancedGP51StatusCard from '@/components/AdminSettings/EnhancedGP51StatusCard';
import GP51CredentialsForm from '@/components/AdminSettings/GP51CredentialsForm';

const GP51Tab: React.FC = () => {
  return (
    <TabsContent value="gp51" className="space-y-4 mt-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">GP51 LIVE Platform Connection</h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure connection to GP51 platform for vehicle data synchronization
        </p>
      </div>
      <EnhancedGP51StatusCard />
      <GP51CredentialsForm />
    </TabsContent>
  );
};

export default GP51Tab;
