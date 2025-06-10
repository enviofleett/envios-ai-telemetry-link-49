
import React from 'react';
import NotificationsSettingsTab from '@/components/settings/NotificationsSettingsTab';

const NotificationsTab: React.FC = () => {
  return (
    <div className="space-y-4 mt-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Fleet Notifications & Alerts</h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure real-time alerts and notification preferences
        </p>
      </div>
      <NotificationsSettingsTab />
    </div>
  );
};

export default NotificationsTab;
