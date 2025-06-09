
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import SMTPSettings from '@/components/AdminSettings/SMTPSettings';

const SMTPTab: React.FC = () => {
  return (
    <TabsContent value="smtp" className="space-y-4 mt-6">
      <SMTPSettings />
    </TabsContent>
  );
};

export default SMTPTab;
