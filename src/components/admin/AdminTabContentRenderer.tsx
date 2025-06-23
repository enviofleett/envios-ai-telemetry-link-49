
import React, { memo } from 'react';

// Import existing tab components
import CompanyTab from './tabs/CompanyTab';
import UsersTab from './tabs/UsersTab';
import SystemTab from './tabs/SystemTab';
import BrandingTab from './tabs/BrandingTab';
import SMTPGuideTab from './tabs/SMTPGuideTab';
import SecurityTab from './tabs/SecurityTab';
import AnalyticsTab from './tabs/AnalyticsTab';
import PaymentGatewayTab from './tabs/PaymentGatewayTab';
import MapsTab from './tabs/MapsTab';
import MarketplaceSettingsTab from './tabs/MarketplaceSettingsTab';
import HealthTab from './tabs/HealthTab';
import DataManagementTab from './tabs/DataManagementTab';
import AIAssistantTab from './tabs/AIAssistantTab';
import GP51SyncTab from './tabs/GP51SyncTab';
import MonitoringTab from './tabs/MonitoringTab';

// Import additional tabs
import GP51IntegrationTab from './tabs/GP51IntegrationTab';
import GP51UserMappingTab from './tabs/GP51UserMappingTab';
import GP51ValidationTab from './tabs/GP51ValidationTab';
import PackagesTab from './tabs/PackagesTab';
import WorkshopsTab from './tabs/WorkshopsTab';
import WorkshopPaymentsTab from './tabs/WorkshopPaymentsTab';
import CurrencyTab from './tabs/CurrencyTab';
import MarketplaceAnalyticsTab from './tabs/MarketplaceAnalyticsTab';
import CustomerAnalyticsTab from './tabs/CustomerAnalyticsTab';
import PaymentAnalyticsTab from './tabs/PaymentAnalyticsTab';
import ReferralAnalyticsTab from './tabs/ReferralAnalyticsTab';
import APIIntegrationsTab from './tabs/APIIntegrationsTab';
import CSVImportTab from './tabs/CSVImportTab';
import UserManagementTab from './tabs/UserManagementTab';
import EmailTriggersTab from './tabs/EmailTriggersTab';
import AdvancedEmailManagementTab from './tabs/AdvancedEmailManagementTab';
import SMSLogsTab from './tabs/SMSLogsTab';
import SMSDeliveryStatusTab from './tabs/SMSDeliveryStatusTab';

interface AdminTabContentRendererProps {
  activeTab: string;
}

const AdminTabContentRenderer: React.FC<AdminTabContentRendererProps> = memo(({ activeTab }) => {
  const renderTabContent = () => {
    switch (activeTab) {
      // Core Settings
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

      // GP51 Integration
      case 'gp51-integration':
        return <GP51IntegrationTab />;
      case 'gp51-sync':
        return <GP51SyncTab />;
      case 'gp51-user-mapping':
        return <GP51UserMappingTab />;
      case 'gp51-validation':
        return <GP51ValidationTab />;

      // Business Management
      case 'packages':
        return <PackagesTab />;
      case 'workshops':
        return <WorkshopsTab />;
      case 'workshop-payments':
        return <WorkshopPaymentsTab />;

      // Payment & Finance
      case 'payment-gateway':
        return <PaymentGatewayTab />;
      case 'currency':
        return <CurrencyTab />;

      // Marketplace
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

      // Customization
      case 'branding':
        return <BrandingTab />;
      case 'maps':
        return <MapsTab />;

      // Integrations
      case 'api-integrations':
        return <APIIntegrationsTab />;
      case 'ai-assistant':
        return <AIAssistantTab />;

      // Monitoring
      case 'monitoring':
        return <MonitoringTab />;
      case 'health':
        return <HealthTab />;

      // Data Management
      case 'data-management':
        return <DataManagementTab />;
      case 'csv-import':
        return <CSVImportTab />;
      case 'user-management':
        return <UserManagementTab />;

      // Communications
      case 'email-triggers':
        return <EmailTriggersTab />;
      case 'advanced-email':
        return <AdvancedEmailManagementTab />;
      case 'smtp-guide':
        return <SMTPGuideTab />;
      case 'sms-logs':
        return <SMSLogsTab />;
      case 'sms-delivery':
        return <SMSDeliveryStatusTab />;

      default:
        return <CompanyTab />;
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
