
import React, { useState } from 'react';
import { SettingsSidebar } from './SettingsSidebar';

// Import existing components
import UsersTab from './tabs/UsersTab';
import WorkshopsTab from './tabs/WorkshopsTab';
import SMTPTab from './tabs/SMTPTab';
import HealthTab from './tabs/HealthTab';
import AnalyticsTab from './tabs/AnalyticsTab';
import GP51IntegrationTab from './tabs/GP51IntegrationTab';
import PackagesTab from './tabs/PackagesTab';
import CSVImportTab from './tabs/CSVImportTab';
import CompanyTab from './tabs/CompanyTab';
import BillingTab from './tabs/BillingTab';
import NotificationsTab from './tabs/NotificationsTab';
import MapsTab from './tabs/MapsTab';
import GeofencingTab from './tabs/GeofencingTab';
import SMTPGuideTab from './tabs/SMTPGuideTab';
import GP51ValidationTab from './tabs/GP51ValidationTab';
import EmailNotificationsTab from './tabs/EmailNotificationsTab';

// Import new enhanced component
import AdminWorkshopManagementEnhanced from './AdminWorkshopManagementEnhanced';

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('packages');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'packages':
        return <PackagesTab />;
      case 'csv-import':
        return <CSVImportTab />;
      case 'company':
        return <CompanyTab />;
      case 'billing':
        return <BillingTab />;
      case 'users':
        return <UsersTab />;
      case 'workshops':
        return <AdminWorkshopManagementEnhanced />;
      case 'notifications':
        return <NotificationsTab />;
      case 'email-notifications':
        return <EmailNotificationsTab />;
      case 'gp51-integration':
        return <GP51IntegrationTab />;
      case 'health':
        return <HealthTab />;
      case 'maps':
        return <MapsTab />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'geofencing':
        return <GeofencingTab />;
      case 'smtp-guide':
        return <SMTPGuideTab />;
      case 'smtp':
        return <SMTPTab />;
      case 'gp51-validation':
        return <GP51ValidationTab />;
      default:
        return <PackagesTab />;
    }
  };

  return (
    <div className="flex h-full min-h-[calc(100vh-8rem)]">
      <SettingsSidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
      
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
