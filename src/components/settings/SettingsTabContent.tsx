
import React from 'react';
import CompanyTab from '@/components/admin/tabs/CompanyTab';
import BrandingTab from '@/components/admin/tabs/BrandingTab';
import CurrencyTab from '@/components/admin/tabs/CurrencyTab';
import UsersTab from '@/components/admin/tabs/UsersTab';
import BillingTab from '@/components/admin/tabs/BillingTab';
import WorkshopsTab from '@/components/admin/tabs/WorkshopsTab';
import EmailTemplatesTab from '@/components/admin/tabs/EmailTemplatesTab';
import EmailTriggersTab from '@/components/admin/tabs/EmailTriggersTab';
import EmailQueueTab from '@/components/admin/tabs/EmailQueueTab';
import AdvancedEmailManagementTab from '@/components/admin/tabs/AdvancedEmailManagementTab';
import SMTPGuideTab from '@/components/admin/tabs/SMTPGuideTab';
import SMSGatewayTab from '@/components/admin/tabs/SMSGatewayTab';
import SMSLogsTab from '@/components/admin/tabs/SMSLogsTab';
import VinApiTab from '@/components/admin/tabs/VinApiTab';
import MapsTab from '@/components/admin/tabs/MapsTab';
import WhatsAppApiTab from '@/components/admin/tabs/WhatsAppApiTab';
import APIIntegrationsTab from '@/components/admin/tabs/APIIntegrationsTab';
import CSVImportTab from '@/components/admin/tabs/CSVImportTab';
import DataManagementTab from '@/components/admin/tabs/DataManagementTab';
import HealthTab from '@/components/admin/tabs/HealthTab';
import NotificationsTab from '@/components/admin/tabs/NotificationsTab';
import SystemTab from '@/components/admin/tabs/SystemTab';
import SecurityTab from '@/components/admin/tabs/SecurityTab';
import GP51IntegrationTab from '@/components/admin/tabs/GP51IntegrationTab';
import GP51ValidationTab from '@/components/admin/tabs/GP51ValidationTab';
import GeofencingTab from '@/components/admin/tabs/GeofencingTab';
import AnalyticsTab from '@/components/admin/tabs/AnalyticsTab';
import PackagesTab from '@/components/admin/tabs/PackagesTab';
import RegistrationManagementTab from '@/components/admin/tabs/RegistrationManagementTab';

interface SettingsTabContentProps {
  activeTab: string;
}

const SettingsTabContent: React.FC<SettingsTabContentProps> = ({ activeTab }) => {
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
    <div className="bg-card border rounded-lg p-6">
      {renderTabContent()}
    </div>
  );
};

export default SettingsTabContent;
