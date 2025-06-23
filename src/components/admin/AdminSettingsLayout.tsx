
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Users, 
  Settings, 
  Palette, 
  Mail, 
  Lock, 
  BarChart3, 
  CreditCard,
  Map,
  ShoppingCart,
  Activity,
  Bot,
  Zap
} from 'lucide-react';

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
import AIAssistantTab from './tabs/AIAssistantTab';
import GP51SyncTab from './tabs/GP51SyncTab';

// Import new monitoring tab
import MonitoringTab from './tabs/MonitoringTab';

interface AdminSettingsLayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminSettingsLayout: React.FC<AdminSettingsLayoutProps> = ({ 
  activeTab, 
  onTabChange 
}) => {
  const tabs = [
    { id: 'company', label: 'Company', icon: Building2, component: CompanyTab },
    { id: 'users', label: 'Users', icon: Users, component: UsersTab },
    { id: 'system', label: 'System', icon: Settings, component: SystemTab },
    { id: 'branding', label: 'Branding', icon: Palette, component: BrandingTab },
    { id: 'smtp', label: 'Email', icon: Mail, component: SMTPGuideTab },
    { id: 'security', label: 'Security', icon: Lock, component: SecurityTab },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, component: AnalyticsTab },
    { id: 'payments', label: 'Payments', icon: CreditCard, component: PaymentGatewayTab },
    { id: 'maps', label: 'Maps', icon: Map, component: MapsTab },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingCart, component: MarketplaceSettingsTab },
    { id: 'monitoring', label: 'Monitoring', icon: Activity, component: MonitoringTab },
    { id: 'health', label: 'Health', icon: Activity, component: HealthTab },
    { id: 'ai', label: 'AI Assistant', icon: Bot, component: AIAssistantTab },
    { id: 'gp51', label: 'GP51 Sync', icon: Zap, component: GP51SyncTab },
  ];

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-8 lg:grid-cols-8 h-auto p-1">
        {tabs.slice(0, 8).map((tab) => {
          const IconComponent = tab.icon;
          return (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id}
              className="flex flex-col items-center space-y-1 p-2 h-auto"
            >
              <IconComponent className="h-4 w-4" />
              <span className="text-xs">{tab.label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
      
      {tabs.length > 8 && (
        <TabsList className="grid w-full grid-cols-6 lg:grid-cols-6 h-auto p-1 mt-2">
          {tabs.slice(8).map((tab) => {
            const IconComponent = tab.icon;
            return (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="flex flex-col items-center space-y-1 p-2 h-auto"
              >
                <IconComponent className="h-4 w-4" />
                <span className="text-xs">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      )}

      {tabs.map((tab) => {
        const TabComponent = tab.component;
        return (
          <TabsContent key={tab.id} value={tab.id} className="mt-6">
            <TabComponent />
          </TabsContent>
        );
      })}
    </Tabs>
  );
};

export default AdminSettingsLayout;
