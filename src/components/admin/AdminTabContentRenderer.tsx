import React, { Suspense } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Shield } from 'lucide-react';
import { StableErrorBoundary } from '@/components/StableErrorBoundary';
import PlatformAdminUsersPanel from './platform/PlatformAdminUsersPanel';
import { useAuth } from '@/contexts/AuthContext';

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

// Fallback for access denied to platform admin tabs
function PlatformAdminPermissionDenied() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-2">
        <Shield className="h-10 w-10 text-gray-400 mx-auto" />
        <h2 className="text-lg font-semibold text-gray-900">Access Denied</h2>
        <div className="text-muted-foreground">
          You must be a super admin or system admin to access this page.
        </div>
      </div>
    </div>
  );
}

// Lazy load all tab components
// Company
const CompanySettingsTab = React.lazy(() => import('../settings/CompanySettingsTab'));
const EnhancedBrandingTab = React.lazy(() => import('../settings/EnhancedBrandingTab'));
const CurrencyManagementTab = React.lazy(() => import('../settings/CurrencyManagementTab'));
// User Management
const UsersTab = React.lazy(() => import('./tabs/UsersTab'));
const BillingTab = React.lazy(() => import('./tabs/BillingTab'));
// Communication
const SMTPConfigurationTab = React.lazy(() => import('../settings/SMTPConfigurationTab'));
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
const GP51ValidationTab = React.lazy(() => import('./tabs/GP51ValidationTab'));
const GeofencingTab = React.lazy(() => import('./tabs/GeofencingTab'));
const MapsTab = React.lazy(() => import('./tabs/MapsTab'));
// Analytics
const AnalyticsTab = React.lazy(() => import('./tabs/AnalyticsTab'));
const PackageManagementDashboard = React.lazy(() => import('../packages/PackageManagementDashboard'));
// Marketplace
const MarketplaceSettingsTab = React.lazy(() => import('./tabs/MarketplaceSettingsTab'));
const AIAssistantTab = React.lazy(() => import('./tabs/AIAssistantTab'));
// Payment Gateway
const PaymentGatewayTab = React.lazy(() => import('./tabs/PaymentGatewayTab'));
const WorkshopPaymentsTab = React.lazy(() => import('./tabs/WorkshopPaymentsTab'));
const PaymentAnalyticsTab = React.lazy(() => import('./tabs/PaymentAnalyticsTab'));
const TransactionManagementTab = React.lazy(() => import('./tabs/TransactionManagementTab'));

interface AdminTabContentRendererProps {
  activeTab: string;
}

const AdminTabContentRenderer: React.FC<AdminTabContentRendererProps> = ({ activeTab }) => {
  const { user, isAdmin, userRole, isPlatformAdmin, platformAdminRoles } = useAuth();

  // Platform admin detection
  // Use explicit boolean check for access to platform admin pages
  const isAllowedPlatformAdmin = isPlatformAdmin && (
    platformAdminRoles.includes("super_admin") ||
    platformAdminRoles.includes("system_admin")
  );

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
        return <MapsTab />;
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
        return <GP51ValidationTab />;
      case 'geofencing':
        return <GeofencingTab />;

      // Analytics tabs
      case 'analytics':
        return <AnalyticsTab />;
      case 'packages':
        return <PackageManagementDashboard />;

      // Marketplace tabs
      case 'marketplace-settings':
        return <MarketplaceSettingsTab />;
      
      case 'ai-assistant-settings':
        return <AIAssistantTab />;

      // Payment Gateway tabs
      case 'payment-gateway':
        return <PaymentGatewayTab />;
      case 'workshop-payments':
        return <WorkshopPaymentsTab />;
      case 'payment-analytics':
        return <PaymentAnalyticsTab />;
      case 'transaction-management':
        return <TransactionManagementTab />;

      // Platform Administration
      case 'platform-admin-users':
        // Use new logic
        if (!isAllowedPlatformAdmin) return <PlatformAdminPermissionDenied />;
        return <PlatformAdminUsersPanel />;

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
