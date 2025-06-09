
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { EmailNotificationSystem } from '@/components/notifications/EmailNotificationSystem';

const EmailNotificationsTab: React.FC = () => {
  return (
    <TabsContent value="email-notifications" className="space-y-4 mt-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Email Notification Management</h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure and manage email templates, delivery logs, and notification settings
        </p>
      </div>
      <EmailNotificationSystem />
    </TabsContent>
  );
};

export default EmailNotificationsTab;
