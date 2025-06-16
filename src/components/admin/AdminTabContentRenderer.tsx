
import React from 'react';
import CompanyTab from './tabs/CompanyTab';
import BrandingTab from './tabs/BrandingTab';
import CurrencyTab from './tabs/CurrencyTab';
import UsersTab from './tabs/UsersTab';
import BillingTab from './tabs/BillingTab';
import WorkshopsTab from './tabs/WorkshopsTab';
import EmailTemplatesTab from './tabs/EmailTemplatesTab';
import EmailTriggersTab from './tabs/EmailTriggersTab';
import EmailQueueTab from './tabs/EmailQueueTab';
import AdvancedEmailManagementTab from './tabs/AdvancedEmailManagementTab';
import SMTPGuideTab from './tabs/SMTPGuideTab';
import SMSGatewayTab from './tabs/SMSGatewayTab';
import SMSLogsTab from './tabs/SMSLogsTab';
import VinApiTab from './tabs/VinApiTab';
import MapsTab from './tabs/MapsTab';
import WhatsAppApiTab from './tabs/WhatsAppApiTab';
import APIIntegrationsTab from './tabs/APIIntegrationsTab';
import CSVImportTab from './tabs/CSVImportTab';
import DataManagementTab from './tabs/DataManagementTab';
import HealthTab from './tabs/HealthTab';
import NotificationsTab from './tabs/NotificationsTab';
import SystemTab from './tabs/SystemTab';
import SecurityTab from './tabs/SecurityTab';
import GP51IntegrationTab from './tabs/GP51IntegrationTab';
import GP51ValidationTab from './tabs/GP51ValidationTab';
import GeofencingTab from './tabs/GeofencingTab';
import AnalyticsTab from './tabs/AnalyticsTab';
import PackagesTab from './tabs/PackagesTab';
import RegistrationManagementTab from './tabs/RegistrationManagementTab';

interface AdminTabContentRendererProps {
  activeTab: string;
}

const AdminTabContentRenderer: React.FC<AdminTabContentRendererProps> = ({ activeTab }) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case 'company':
        return <CompanyTab />;
      case 'branding':
        return <BrandingTab />;
      case 'currency':
        return <CurrencyTab />;
      case 'users':
        return <UsersTab />;
      case 'billing':
        return <BillingTab />;
      case 'workshops':
        return <WorkshopsTab />;
      case 'email-templates':
        return <EmailTemplatesTab />;
      case 'email-triggers':
        return <EmailTriggersTab />;
      case 'email-queue':
        return <EmailQueueTab />;
      case 'advanced-email':
        return <AdvancedEmailManagementTab />;
      case 'smtp-guide':
        return <SMTPGuideTab />;
      case 'sms-settings':
        return <SMSGatewayTab />;
      case 'sms-logs':
        return <SMSLogsTab />;
      case 'vin-api':
        return <VinApiTab />;
      case 'maps':
        return <MapsTab />;
      case 'whatsapp-api':
        return <WhatsAppApiTab />;
      case 'api-integrations':
        return <APIIntegrationsTab />;
      case 'csv-import':
        return <CSVImportTab />;
      case 'data-management':
        return <DataManagementTab />;
      case 'health':
        return <HealthTab />;
      case 'notifications':
        return <NotificationsTab />;
      case 'system':
        return <SystemTab />;
      case 'security':
        return <SecurityTab />;
      case 'gp51':
        return <GP51IntegrationTab />;
      case 'gp51-validation':
        return <GP51ValidationTab />;
      case 'geofencing':
        return <GeofencingTab />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'packages':
        return <PackagesTab />;
      case 'registration-management':
        return <RegistrationManagementTab />;
      default:
        return <CompanyTab />;
    }
  };

  return (
    <div className="space-y-6">
      {renderTabContent()}
    </div>
  );
};

export default AdminTabContentRenderer;
