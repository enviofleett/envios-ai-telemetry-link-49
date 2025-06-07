
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import SMTPProviderGuide from '@/components/AdminSettings/SMTPProviderGuide';

const SMTPGuideTab: React.FC = () => {
  return (
    <TabsContent value="smtp-guide" className="space-y-4 mt-6">
      <SMTPProviderGuide />
    </TabsContent>
  );
};

export default SMTPGuideTab;
