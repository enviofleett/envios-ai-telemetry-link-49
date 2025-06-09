
import React from 'react';
import { EmailNotificationSystem } from '@/components/notifications/EmailNotificationSystem';

const EmailNotificationsTab: React.FC = () => {
  return (
    <div className="space-y-4 mt-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Email Notification Management</h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure and manage email templates, delivery logs, and notification settings
        </p>
      </div>
      <EmailNotificationSystem />
    </div>
  );
};

export default EmailNotificationsTab;
