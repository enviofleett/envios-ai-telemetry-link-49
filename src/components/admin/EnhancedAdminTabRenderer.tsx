
import React from 'react';
import PackagesTab from './tabs/PackagesTab';
import UsersTab from './tabs/UsersTab';
import GP51IntegrationTab from './tabs/GP51IntegrationTab';
import SystemSettingsTab from './tabs/SystemSettingsTab';
import SecurityTab from './tabs/SecurityTab';
import NotificationsTab from './tabs/NotificationsTab';
import AnalyticsTab from './tabs/AnalyticsTab';
import BillingTab from './tabs/BillingTab';
import CompanyTab from './tabs/CompanyTab';
import MapsTab from './tabs/MapsTab';
import WorkshopsTab from './tabs/WorkshopsTab';
import EnhancedBrandingTab from '@/components/settings/EnhancedBrandingTab';
import CurrencyManagementTab from '@/components/settings/CurrencyManagementTab';

interface EnhancedAdminTabRendererProps {
  activeTab: string;
}

const EnhancedAdminTabRenderer: React.FC<EnhancedAdminTabRendererProps> = ({ activeTab }) => {
  console.log('EnhancedAdminTabRenderer rendering tab:', activeTab);

  switch (activeTab) {
    case 'packages':
      return <PackagesTab />;
    case 'users':
      return <UsersTab />;
    case 'gp51':
      return <GP51IntegrationTab />;
    case 'system':
      return <SystemSettingsTab />;
    case 'security':
      return <SecurityTab />;
    case 'notifications':
      return <NotificationsTab />;
    case 'analytics':
      return <AnalyticsTab />;
    case 'billing':
      return <BillingTab />;
    case 'company':
      return <CompanyTab />;
    case 'branding':
      return <EnhancedBrandingTab />;
    case 'currency':
      return <CurrencyManagementTab />;
    case 'maps':
      return <MapsTab />;
    case 'workshops':
      return <WorkshopsTab />;
    default:
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Tab not found</h3>
            <p className="text-muted-foreground">
              The requested tab "{activeTab}" could not be found.
            </p>
          </div>
        </div>
      );
  }
};

export default EnhancedAdminTabRenderer;
