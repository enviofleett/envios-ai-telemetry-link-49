
import React, { useState } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { GP51CredentialsForm } from '@/components/gp51/GP51CredentialsForm';
import { GP51DeviceList } from '@/components/gp51/GP51DeviceList';

export const GP51IntegrationTab: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <TabsContent value="gp51-integration" className="space-y-6 mt-6">
      <GP51CredentialsForm onConnectionChange={setIsConnected} />
      {isConnected && <GP51DeviceList />}
    </TabsContent>
  );
};

export default GP51IntegrationTab;
