
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import NotificationsSettingsTab from '@/components/settings/NotificationsSettingsTab';

const NotificationsTab: React.FC = () => {
  return (
    <TabsContent value="notifications" className="space-y-4 mt-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Fleet Notifications & Alerts</h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure real-time alerts, notifications, and delivery preferences
        </p>
      </div>
      <NotificationsSettingsTab />
    </TabsContent>
  );
};

export default NotificationsTab;
