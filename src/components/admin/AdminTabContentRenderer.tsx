
import React, { memo, Suspense } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';

// Import existing tab components with error handling
const CompanyTab = React.lazy(() => import('./tabs/CompanyTab').catch(() => ({ default: () => <MissingComponent name="CompanyTab" /> })));
const UsersTab = React.lazy(() => import('./tabs/UsersTab').catch(() => ({ default: () => <MissingComponent name="UsersTab" /> })));
const SystemTab = React.lazy(() => import('./tabs/SystemTab').catch(() => ({ default: () => <MissingComponent name="SystemTab" /> })));
const BrandingTab = React.lazy(() => import('./tabs/BrandingTab').catch(() => ({ default: () => <MissingComponent name="BrandingTab" /> })));
const SMTPGuideTab = React.lazy(() => import('./tabs/SMTPGuideTab').catch(() => ({ default: () => <MissingComponent name="SMTPGuideTab" /> })));
const SecurityTab = React.lazy(() => import('./tabs/SecurityTab').catch(() => ({ default: () => <MissingComponent name="SecurityTab" /> })));
const AnalyticsTab = React.lazy(() => import('./tabs/AnalyticsTab').catch(() => ({ default: () => <MissingComponent name="AnalyticsTab" /> })));
const PaymentGatewayTab = React.lazy(() => import('./tabs/PaymentGatewayTab').catch(() => ({ default: () => <MissingComponent name="PaymentGatewayTab" /> })));
const MapsTab = React.lazy(() => import('./tabs/MapsTab').catch(() => ({ default: () => <MissingComponent name="MapsTab" /> })));
const MarketplaceSettingsTab = React.lazy(() => import('./tabs/MarketplaceSettingsTab').catch(() => ({ default: () => <MissingComponent name="MarketplaceSettingsTab" /> })));
const HealthTab = React.lazy(() => import('./tabs/HealthTab').catch(() => ({ default: () => <MissingComponent name="HealthTab" /> })));
const DataManagementTab = React.lazy(() => import('./tabs/DataManagementTab').catch(() => ({ default: () => <MissingComponent name="DataManagementTab" /> })));
const AIAssistantTab = React.lazy(() => import('./tabs/AIAssistantTab').catch(() => ({ default: () => <MissingComponent name="AIAssistantTab" /> })));
const GP51SyncTab = React.lazy(() => import('./tabs/GP51SyncTab').catch(() => ({ default: () => <MissingComponent name="GP51SyncTab" /> })));
const MonitoringTab = React.lazy(() => import('./tabs/MonitoringTab').catch(() => ({ default: () => <MissingComponent name="MonitoringTab" /> })));
const GP51IntegrationTab = React.lazy(() => import('./tabs/GP51IntegrationTab').catch(() => ({ default: () => <MissingComponent name="GP51IntegrationTab" /> })));
const GP51UserMappingTab = React.lazy(() => import('./tabs/GP51UserMappingTab').catch(() => ({ default: () => <MissingComponent name="GP51UserMappingTab" /> })));
const GP51ValidationTab = React.lazy(() => import('./tabs/GP51ValidationTab').catch(() => ({ default: () => <MissingComponent name="GP51ValidationTab" /> })));

// Add other tab imports with similar error handling...

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-6 w-6 animate-spin mr-2" />
    <span className="text-sm text-muted-foreground">Loading...</span>
  </div>
);

const MissingComponent: React.FC<{ name: string }> = ({ name }) => (
  <Alert>
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>Component Not Available</AlertTitle>
    <AlertDescription>
      The {name} component is currently unavailable. Please check back later or contact support.
    </AlertDescription>
  </Alert>
);

interface AdminTabContentRendererProps {
  activeTab: string;
}

const AdminTabContentRenderer: React.FC<AdminTabContentRendererProps> = memo(({ activeTab }) => {
  console.log(`🎯 [AdminTabContentRenderer] Rendering tab: ${activeTab}`);

  const renderTabContent = () => {
    try {
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

        // Payment & Finance
        case 'payment-gateway':
          return <PaymentGatewayTab />;

        // Marketplace
        case 'marketplace-settings':
          return <MarketplaceSettingsTab />;

        // Customization
        case 'branding':
          return <BrandingTab />;
        case 'maps':
          return <MapsTab />;

        // Integrations
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

        // Communications
        case 'smtp-guide':
          return <SMTPGuideTab />;

        default:
          console.warn(`⚠️ [AdminTabContentRenderer] Unknown tab: ${activeTab}, falling back to CompanyTab`);
          return <CompanyTab />;
      }
    } catch (error) {
      console.error(`❌ [AdminTabContentRenderer] Error rendering tab ${activeTab}:`, error);
      return <MissingComponent name={`${activeTab} tab`} />;
    }
  };

  return (
    <div className="w-full">
      <Suspense fallback={<LoadingSpinner />}>
        {renderTabContent()}
      </Suspense>
    </div>
  );
});

AdminTabContentRenderer.displayName = 'AdminTabContentRenderer';

export default AdminTabContentRenderer;
