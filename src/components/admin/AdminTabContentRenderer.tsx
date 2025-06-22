
import React, { memo } from 'react';
import CompanyTab from './tabs/CompanyTab';
import UsersTab from './tabs/UsersTab';
import SystemTab from './tabs/SystemTab';
import SecurityTab from './tabs/SecurityTab';
import AnalyticsTab from './tabs/AnalyticsTab';
import GP51IntegrationTab from './tabs/GP51IntegrationTab';
import GP51SyncTab from './tabs/GP51SyncTab';
import GP51UserMappingTab from './tabs/GP51UserMappingTab';
import GP51ValidationTab from './tabs/GP51ValidationTab';
import PackagesTab from './tabs/PackagesTab';
import WorkshopsTab from './tabs/WorkshopsTab';
import PaymentGatewayTab from './tabs/PaymentGatewayTab';
import CurrencyTab from './tabs/CurrencyTab';
import BrandingTab from './tabs/BrandingTab';
import MapsTab from './tabs/MapsTab';
import APIIntegrationsTab from './tabs/APIIntegrationsTab';
import HealthTab from './tabs/HealthTab';
import DataManagementTab from './tabs/DataManagementTab';
import CSVImportTab from './tabs/CSVImportTab';
import EmailTriggersTab from './tabs/EmailTriggersTab';
import AdvancedEmailManagementTab from './tabs/AdvancedEmailManagementTab';
import SMSLogsTab from './tabs/SMSLogsTab';
import SMSDeliveryStatusTab from './tabs/SMSDeliveryStatusTab';
import SMTPGuideTab from './tabs/SMTPGuideTab';
import UserManagementTab from './tabs/UserManagementTab';
import MarketplaceSettingsTab from './tabs/MarketplaceSettingsTab';
import MarketplaceAnalyticsTab from './tabs/MarketplaceAnalyticsTab';
import CustomerAnalyticsTab from './tabs/CustomerAnalyticsTab';
import PaymentAnalyticsTab from './tabs/PaymentAnalyticsTab';
import ReferralAnalyticsTab from './tabs/ReferralAnalyticsTab';
import WorkshopPaymentsTab from './tabs/WorkshopPaymentsTab';
import AIAssistantTab from './tabs/AIAssistantTab';

interface AdminTabContentRendererProps {
  activeTab: string;
}

const AdminTabContentRenderer: React.FC<AdminTabContentRendererProps> = memo(({ activeTab }) => {
  console.log('AdminTabContentRenderer rendering tab:', activeTab);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'company':
        return <CompanyTab />;
      case 'users':
        return <UsersTab />;
      case 'system':
        return <SystemTab />;
      case 'security':
        return <SecurityTab />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'gp51-integration':
        return <GP51IntegrationTab />;
      case 'gp51-sync':
        return <GP51SyncTab />;
      case 'gp51-user-mapping':
        return <GP51UserMappingTab />;
      case 'gp51-validation':
        return <GP51ValidationTab />;
      case 'packages':
        return <PackagesTab />;
      case 'workshops':
        return <WorkshopsTab />;
      case 'payment-gateway':
        return <PaymentGatewayTab />;
      case 'currency':
        return <CurrencyTab />;
      case 'branding':
        return <BrandingTab />;
      case 'maps':
        return <MapsTab />;
      case 'api-integrations':
        return <APIIntegrationsTab />;
      case 'health':
        return <HealthTab />;
      case 'data-management':
        return <DataManagementTab />;
      case 'csv-import':
        return <CSVImportTab />;
      case 'email-triggers':
        return <EmailTriggersTab />;
      case 'advanced-email':
        return <AdvancedEmailManagementTab />;
      case 'sms-logs':
        return <SMSLogsTab />;
      case 'sms-delivery':
        return <SMSDeliveryStatusTab />;
      case 'smtp-guide':
        return <SMTPGuideTab />;
      case 'user-management':
        return <UserManagementTab />;
      case 'marketplace-settings':
        return <MarketplaceSettingsTab />;
      case 'marketplace-analytics':
        return <MarketplaceAnalyticsTab />;
      case 'customer-analytics':
        return <CustomerAnalyticsTab />;
      case 'payment-analytics':
        return <PaymentAnalyticsTab />;
      case 'referral-analytics':
        return <ReferralAnalyticsTab />;
      case 'workshop-payments':
        return <WorkshopPaymentsTab />;
      case 'ai-assistant':
        return <AIAssistantTab />;
      default:
        return (
          <div className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Tab Not Found</h2>
            <p className="text-muted-foreground">The requested tab "{activeTab}" could not be found.</p>
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      {renderTabContent()}
    </div>
  );
});

AdminTabContentRenderer.displayName = 'AdminTabContentRenderer';

export default AdminTabContentRenderer;
