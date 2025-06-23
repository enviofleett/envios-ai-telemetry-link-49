
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
import SMSSettingsTab from './tabs/SMSSettingsTab';
import SMSLogsTab from './tabs/SMSLogsTab';
import EmailTriggersAdminTab from './tabs/EmailTriggersAdminTab';
import AdvancedEmailManagementTab from './tabs/AdvancedEmailManagementTab';

// Import existing working tabs from settings directory
import CompanySettingsTab from '../settings/CompanySettingsTab';
import EnhancedBrandingTab from '../settings/EnhancedBrandingTab';
import CurrencyManagementTab from '../settings/CurrencyManagementTab';
import SMTPConfigurationTab from '../settings/SMTPConfigurationTab'; // Corrected import path

// Import missing tabs
import VinApiTab from './tabs/VinApiTab';
import MapsTab from './tabs/MapsTab';
import WhatsAppApiTab from './tabs/WhatsAppApiTab';
import CSVImportTab from './tabs/CSVImportTab';
import WorkshopsTab from './tabs/WorkshopsTab';
import GP51ValidationTab from './tabs/GP51ValidationTab';
import SMTPGuideTab from './tabs/SMTPGuideTab';
import APIIntegrationsTab from './tabs/APIIntegrationsTab';

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
      
      // New Email Management Features
      case 'smtp-config':
        return <SMTPConfigurationTab />;
      case 'email-triggers':
        return <EmailTriggersAdminTab />;
      case 'advanced-email':
        return <AdvancedEmailManagementTab />;
      case 'smtp-guide':
        return <SMTPGuideTab />;
      
      // SMS functionality
      case 'sms-settings':
        return <SMSSettingsTab />;
      case 'sms-logs':
        return <SMSLogsTab />;
      
      // API Integration tabs
      case 'vin-api':
        return <VinApiTab />;
      case 'maps':
        return <MapsTab />;
      case 'whatsapp-api':
        return <WhatsAppApiTab />;
      case 'api-integrations':
        return <APIIntegrationsTab />;
      
      // Data Management tabs
      case 'csv-import':
        return <CSVImportTab />;
      
      // User Management tabs
      case 'workshops':
        return <WorkshopsTab />;
      
      // Integration tabs
      case 'gp51':
        return <GP51IntegrationTab />;
      case 'gp51-validation':
        return <GP51ValidationTab />;
      case 'geofencing':
        return <GeofencingTab />;
      
      // Phase 2 - Static tabs (to be connected next)
      case 'packages':
        return <PackagesTab />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'notifications':
        return <NotificationsTab />;
      case 'security':
        return <SecurityTab />;
      case 'system':
        return <SystemSettingsTab />;
      
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
