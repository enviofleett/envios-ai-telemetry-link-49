
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

// Import working tabs
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
import SMTPConfigurationTab from './tabs/SMTPConfigurationTab';
import EmailTriggersAdminTab from './tabs/EmailTriggersAdminTab';
import AdvancedEmailManagementTab from './tabs/AdvancedEmailManagementTab';

// Import existing working tabs from settings directory
import CompanySettingsTab from '../settings/CompanySettingsTab';
import EnhancedBrandingTab from '../settings/EnhancedBrandingTab';
import CurrencyManagementTab from '../settings/CurrencyManagementTab';

interface AdminTabContentRendererProps {
  activeTab: string;
}

const ComingSoonTab: React.FC<{ tabName: string }> = ({ tabName }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Alert className="max-w-md">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        The {tabName} tab is coming soon. This feature is currently under development.
      </AlertDescription>
    </Alert>
  </div>
);

const AdminTabContentRenderer: React.FC<AdminTabContentRendererProps> = ({ activeTab }) => {
  console.log('AdminTabContentRenderer rendering tab:', activeTab);

  switch (activeTab) {
    // Company tabs
    case 'company':
      return <CompanySettingsTab />;
    case 'branding':
      return <EnhancedBrandingTab />;
    case 'currency':
      return <CurrencyManagementTab />;

    // User Management tabs
    case 'users':
      return <UsersTab />;
    case 'billing':
      return <BillingTab />;
    case 'workshops':
      return <ComingSoonTab tabName="Workshops" />;

    // Communication tabs
    case 'smtp-config':
      return <SMTPConfigurationTab />;
    case 'email-templates':
      return <EmailTemplatesTab />;
    case 'email-triggers':
      return <EmailTriggersAdminTab />;
    case 'email-queue':
      return <EmailQueueTab />;
    case 'advanced-email':
      return <AdvancedEmailManagementTab />;
    case 'smtp-guide':
      return <ComingSoonTab tabName="SMTP Guide" />;
    case 'sms-settings':
      return <SMSSettingsTab />;
    case 'sms-logs':
      return <SMSLogsTab />;

    // API Integrations tabs
    case 'vin-api':
      return <ComingSoonTab tabName="VIN API" />;
    case 'maps':
      return <ComingSoonTab tabName="Maps API" />;
    case 'whatsapp-api':
      return <ComingSoonTab tabName="WhatsApp API" />;
    case 'api-integrations':
      return <ComingSoonTab tabName="API Management" />;

    // Data Management tabs
    case 'csv-import':
      return <ComingSoonTab tabName="CSV Import" />;
    case 'data-management':
      return <ComingSoonTab tabName="Data Management" />;

    // System tabs
    case 'health':
      return <HealthTab />;
    case 'notifications':
      return <NotificationsTab />;
    case 'system':
      return <SystemSettingsTab />;
    case 'security':
      return <SecurityTab />;

    // Integration tabs
    case 'gp51':
      return <GP51IntegrationTab />;
    case 'gp51-validation':
      return <ComingSoonTab tabName="GP51 Validation" />;
    case 'geofencing':
      return <GeofencingTab />;

    // Analytics tabs
    case 'analytics':
      return <AnalyticsTab />;
    case 'packages':
      return <PackagesTab />;

    default:
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Alert className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Tab "{activeTab}" not found. Please select a valid tab from the sidebar.
            </AlertDescription>
          </Alert>
        </div>
      );
  }
};

export default AdminTabContentRenderer;
