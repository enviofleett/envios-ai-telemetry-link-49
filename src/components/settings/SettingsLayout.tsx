
import React, { memo } from 'react';
import SettingsSidebar from './SettingsSidebar';
import SettingsTabContent from './SettingsTabContent';

interface SettingsLayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const SettingsLayout: React.FC<SettingsLayoutProps> = memo(({ 
  activeTab, 
  onTabChange 
}) => {
  return (
    <div className="flex gap-6">
      <div className="w-64 flex-shrink-0">
        <SettingsSidebar 
          activeTab={activeTab} 
          onTabChange={onTabChange} 
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <SettingsTabContent activeTab={activeTab} />
      </div>
    </div>
  );
});

SettingsLayout.displayName = 'SettingsLayout';

export default SettingsLayout;
