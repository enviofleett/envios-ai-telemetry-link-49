
import React from 'react';
import UsersTab from './tabs/UsersTab';
import BillingTab from './tabs/BillingTab';
import HealthTab from './tabs/HealthTab';
import EmailTemplatesTab from './tabs/EmailTemplatesTab';
import EmailQueueTab from './tabs/EmailQueueTab';
import PackagesTab from './tabs/PackagesTab';
import AnalyticsTab from './tabs/AnalyticsTab';
import GP51IntegrationTab from './tabs/GP51IntegrationTab';
import NotificationsTab from './tabs/NotificationsTab';
import SecurityTab from './tabs/SecurityTab';
import SystemSettingsTab from './tabs/SystemSettingsTab';
import GeofencingTab from './tabs/GeofencingTab';

// Import existing working tabs from settings directory
import CompanySettingsTab from '../../settings/CompanySettingsTab';
import EnhancedBrandingTab from '../../settings/EnhancedBrandingTab';
import CurrencyManagementTab from '../../settings/CurrencyManagementTab';

interface EnhancedAdminTabRendererProps {
  activeTab: string;
}

const EnhancedAdminTabRenderer: React.FC<EnhancedAdminTabRendererProps> = ({ activeTab }) => {
  console.log('Enhanced Admin Tab Renderer - Active Tab:', activeTab);

  const renderTabContent = () => {
    switch (activeTab) {
      // Working tabs with backend connections
      case 'company':
        return <CompanySettingsTab />;
      case 'branding':
        return <EnhancedBrandingTab />;
      case 'currency':
        return <CurrencyManagementTab />;
      
      // Phase 1 - Now connected to backend
      case 'users':
        return <UsersTab />;
      case 'billing':
        return <BillingTab />;
      case 'health':
        return <HealthTab />;
      case 'email-templates':
        return <EmailTemplatesTab />;
      case 'email-queue':
        return <EmailQueueTab />;
      
      // Phase 2 - Static tabs (to be connected next)
      case 'packages':
        return <PackagesTab />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'gp51':
        return <GP51IntegrationTab />;
      case 'notifications':
        return <NotificationsTab />;
      case 'security':
        return <SecurityTab />;
      case 'system':
        return <SystemSettingsTab />;
      case 'geofencing':
        return <GeofencingTab />;
      
      default:
        return (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tab Not Found</h3>
              <p className="text-gray-600">
                The tab "{activeTab}" is not implemented yet.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      {renderTabContent()}
    </div>
  );
};

export default EnhancedAdminTabRenderer;
