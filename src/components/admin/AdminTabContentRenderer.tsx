import React, { Suspense } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { StableErrorBoundary } from '@/components/StableErrorBoundary';

// Generic loader for suspended tabs
const TabContentLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading tab...</p>
    </div>
  </div>
);

// Helper for coming soon tabs
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

// Lazy load all tab components
// Company
const CompanySettingsTab = React.lazy(() => import('../settings/CompanySettingsTab'));
const EnhancedBrandingTab = React.lazy(() => import('../settings/EnhancedBrandingTab'));
const CurrencyManagementTab = React.lazy(() => import('../settings/CurrencyManagementTab'));
// User Management
const UsersTab = React.lazy(() => import('./tabs/UsersTab'));
const BillingTab = React.lazy(() => import('./tabs/BillingTab'));
// Communication
const SMTPConfigurationTab = React.lazy(() => import('./tabs/SMTPConfigurationTab'));
const EmailTemplatesTab = React.lazy(() => import('./tabs/EmailTemplatesTab'));
const EmailTriggersAdminTab = React.lazy(() => import('./tabs/EmailTriggersAdminTab'));
const EmailQueueTab = React.lazy(() => import('./tabs/EmailQueueTab'));
const AdvancedEmailManagementTab = React.lazy(() => import('./tabs/AdvancedEmailManagementTab'));
const SMSSettingsTab = React.lazy(() => import('./tabs/SMSSettingsTab'));
const SMSLogsTab = React.lazy(() => import('./tabs/SMSLogsTab'));
// System
const HealthTab = React.lazy(() => import('./tabs/HealthTab'));
const NotificationsTab = React.lazy(() => import('./tabs/NotificationsTab'));
const SystemSettingsTab = React.lazy(() => import('./tabs/SystemSettingsTab'));
const SecurityTab = React.lazy(() => import('./tabs/SecurityTab'));
// Integration
const GP51IntegrationTab = React.lazy(() => import('./tabs/GP51IntegrationTab'));
const GeofencingTab = React.lazy(() => import('./tabs/GeofencingTab'));
// Analytics
const AnalyticsTab = React.lazy(() => import('./tabs/AnalyticsTab'));
const PackageManagementDashboard = React.lazy(() => import('../packages/PackageManagementDashboard'));

interface AdminTabContentRendererProps {
  activeTab: string;
}

const AdminTabContentRenderer: React.FC<AdminTabContentRendererProps> = ({ activeTab }) => {
  const renderTabContent = () => {
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
        return <PackageManagementDashboard />;

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
  
  return (
    <StableErrorBoundary>
      <Suspense fallback={<TabContentLoader />}>
        {renderTabContent()}
      </Suspense>
    </StableErrorBoundary>
  );
};

export default AdminTabContentRenderer;
