
import React, { useState } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { GP51CredentialsForm } from '@/components/gp51/GP51CredentialsForm';
import { GP51DeviceList } from '@/components/gp51/GP51DeviceList';
import { GP51StatusIndicator } from '@/components/gp51/GP51StatusIndicator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const GP51IntegrationTab: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <TabsContent value="gp51" className="space-y-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>GP51 Connection Status</CardTitle>
          <CardDescription>
            Real-time status of your GP51 integration and session health
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GP51StatusIndicator />
        </CardContent>
      </Card>

      <GP51CredentialsForm onConnectionChange={setIsConnected} />
      
      {isConnected && <GP51DeviceList />}
    </TabsContent>
  );
};

export default GP51IntegrationTab;
