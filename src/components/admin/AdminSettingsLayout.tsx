
import React from 'react';
import { SettingsSidebar } from './SettingsSidebar';
import AdminTabContentRenderer from './AdminTabContentRenderer';

interface AdminSettingsLayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminSettingsLayout: React.FC<AdminSettingsLayoutProps> = ({ 
  activeTab, 
  onTabChange 
}) => {
  console.log('AdminSettingsLayout rendering with activeTab:', activeTab);

  return (
    <div className="flex h-full min-h-[calc(100vh-8rem)]">
      <SettingsSidebar 
        activeTab={activeTab} 
        onTabChange={onTabChange} 
      />
      
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <AdminTabContentRenderer activeTab={activeTab} />
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsLayout;
