
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import WorkshopMarketplace from '@/components/workshops/WorkshopMarketplace';

const WorkshopsTab: React.FC = () => {
  return (
    <TabsContent value="workshops" className="space-y-4">
      <WorkshopMarketplace />
    </TabsContent>
  );
};

export default WorkshopsTab;
