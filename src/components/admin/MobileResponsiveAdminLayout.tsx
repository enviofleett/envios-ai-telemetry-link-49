
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Users, Wrench, Building, CreditCard, Bell, Mail, Zap, Send, Clock, Server, BookOpen, MessageSquare, FileText, Radio, CheckCircle, Map, MapPin, Link, Car, BarChart, Shield, Upload, Database, Settings, Activity } from 'lucide-react';
import PackagesTab from './tabs/PackagesTab';
import UsersTab from './tabs/UsersTab';
import WorkshopsTab from './tabs/WorkshopsTab';
import CompanyTab from './tabs/CompanyTab';
import BillingTab from './tabs/BillingTab';
import NotificationsTab from './tabs/NotificationsTab';
import EmailTemplatesTab from './tabs/EmailTemplatesTab';
import EmailTriggersAdminTab from './tabs/EmailTriggersAdminTab';
import AdvancedEmailManagementTab from './tabs/AdvancedEmailManagementTab';
import EmailQueueTab from './tabs/EmailQueueTab';
import SMTPConfigurationTab from './tabs/SMTPConfigurationTab';
import SMTPGuideTab from './tabs/SMTPGuideTab';
import SMSSettingsTab from './tabs/SMSSettingsTab';
import SMSLogsTab from './tabs/SMSLogsTab';
import GP51IntegrationTab from './tabs/GP51IntegrationTab';
import GP51ValidationTab from './tabs/GP51ValidationTab';
import MapsTab from './tabs/MapsTab';
import GeofencingTab from './tabs/GeofencingTab';
import APIIntegrationsTab from './tabs/APIIntegrationsTab';
import AnalyticsTab from './tabs/AnalyticsTab';
import SecurityTab from './tabs/SecurityTab';
import CSVImportTab from './tabs/CSVImportTab';
import DataManagementTab from './tabs/DataManagementTab';
import SystemSettingsTab from './tabs/SystemSettingsTab';
import HealthTab from './tabs/HealthTab';
import VinApiTab from './tabs/VinApiTab';

interface MobileResponsiveAdminLayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const MobileResponsiveAdminLayout: React.FC<MobileResponsiveAdminLayoutProps> = ({ 
  activeTab, 
  onTabChange 
}) => {
  const tabs = [
    { id: 'packages', label: 'Packages', icon: Package },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'workshops', label: 'Workshops', icon: Wrench },
    { id: 'company', label: 'Company', icon: Building },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'email-templates', label: 'Email Templates', icon: Mail },
    { id: 'email-triggers', label: 'Email Triggers', icon: Zap },
    { id: 'email-campaigns', label: 'Email Campaigns', icon: Send },
    { id: 'email-queue', label: 'Email Queue', icon: Clock },
    { id: 'smtp-config', label: 'SMTP Config', icon: Server },
    { id: 'smtp-guide', label: 'SMTP Guide', icon: BookOpen },
    { id: 'sms-settings', label: 'SMS Settings', icon: MessageSquare },
    { id: 'sms-logs', label: 'SMS Logs', icon: FileText },
    { id: 'gp51-integration', label: 'GP51 Integration', icon: Radio },
    { id: 'gp51-validation', label: 'GP51 Validation', icon: CheckCircle },
    { id: 'maps', label: 'Maps', icon: Map },
    { id: 'geofencing', label: 'Geofencing', icon: MapPin },
    { id: 'api-integrations', label: 'API Integrations', icon: Link },
    { id: 'vin-api', label: 'VIN API', icon: Car },
    { id: 'analytics', label: 'Analytics', icon: BarChart },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'csv-import', label: 'CSV Import', icon: Upload },
    { id: 'data-management', label: 'Data Management', icon: Database },
    { id: 'system-settings', label: 'System Settings', icon: Settings },
    { id: 'health', label: 'Health', icon: Activity }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'packages':
        return <PackagesTab />;
      case 'users':
        return <UsersTab />;
      case 'workshops':
        return <WorkshopsTab />;
      case 'company':
        return <CompanyTab />;
      case 'billing':
        return <BillingTab />;
      case 'notifications':
        return <NotificationsTab />;
      case 'email-templates':
        return <EmailTemplatesTab />;
      case 'email-triggers':
        return <EmailTriggersAdminTab />;
      case 'email-campaigns':
        return <AdvancedEmailManagementTab />;
      case 'email-queue':
        return <EmailQueueTab />;
      case 'smtp-config':
        return <SMTPConfigurationTab />;
      case 'smtp-guide':
        return <SMTPGuideTab />;
      case 'sms-settings':
        return <SMSSettingsTab />;
      case 'sms-logs':
        return <SMSLogsTab />;
      case 'gp51-integration':
        return <GP51IntegrationTab />;
      case 'gp51-validation':
        return <GP51ValidationTab />;
      case 'maps':
        return <MapsTab />;
      case 'geofencing':
        return <GeofencingTab />;
      case 'api-integrations':
        return <APIIntegrationsTab />;
      case 'vin-api':
        return <VinApiTab />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'security':
        return <SecurityTab />;
      case 'csv-import':
        return <CSVImportTab />;
      case 'data-management':
        return <DataManagementTab />;
      case 'system-settings':
        return <SystemSettingsTab />;
      case 'health':
        return <HealthTab />;
      default:
        return <PackagesTab />;
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-4">
      <TabsList className="w-full overflow-x-scroll scrollbar-none">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className="whitespace-nowrap">
            <div className="flex items-center gap-2">
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </div>
          </TabsTrigger>
        ))}
      </TabsList>
      
      {/* Tab content */}
      <TabsContent value={activeTab} className="focus:outline-none">
        {renderTabContent()}
      </TabsContent>
    </Tabs>
  );
};

export default MobileResponsiveAdminLayout;
