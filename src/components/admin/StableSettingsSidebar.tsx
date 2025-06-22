import React, { memo } from 'react';
import { 
  Settings, 
  Users, 
  Shield, 
  BarChart3, 
  Truck,
  RefreshCw,
  UserCheck,
  CheckSquare,
  Package,
  Wrench,
  CreditCard,
  DollarSign,
  Palette,
  Map,
  Plug,
  Activity,
  Database,
  FileSpreadsheet,
  Mail,
  MessageSquare,
  Send,
  Smartphone,
  Globe,
  UserCog,
  Store,
  TrendingUp,
  Users2,
  Banknote,
  GitBranch,
  Bot
} from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  category?: string;
}

const sidebarItems: SidebarItem[] = [
  // Core Settings
  { id: 'company', label: 'Company', icon: Settings, category: 'Core' },
  { id: 'users', label: 'Users', icon: Users, category: 'Core' },
  { id: 'system', label: 'System', icon: Settings, category: 'Core' },
  { id: 'security', label: 'Security', icon: Shield, category: 'Core' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, category: 'Core' },

  // GP51 Integration
  { id: 'gp51-integration', label: 'GP51 Connection', icon: Truck, category: 'GP51' },
  { id: 'gp51-sync', label: 'GP51 Sync', icon: RefreshCw, category: 'GP51' },
  { id: 'gp51-user-mapping', label: 'User Mapping', icon: UserCheck, category: 'GP51' },
  { id: 'gp51-validation', label: 'GP51 Validation', icon: CheckSquare, category: 'GP51' },

  // Business Management
  { id: 'packages', label: 'Packages', icon: Package, category: 'Business' },
  { id: 'workshops', label: 'Workshops', icon: Wrench, category: 'Business' },
  { id: 'workshop-payments', label: 'Workshop Payments', icon: Banknote, category: 'Business' },

  // Payment & Finance
  { id: 'payment-gateway', label: 'Payment Gateway', icon: CreditCard, category: 'Finance' },
  { id: 'currency', label: 'Currency', icon: DollarSign, category: 'Finance' },

  // Marketplace
  { id: 'marketplace-settings', label: 'Marketplace Settings', icon: Store, category: 'Marketplace' },
  { id: 'marketplace-analytics', label: 'Marketplace Analytics', icon: TrendingUp, category: 'Marketplace' },
  { id: 'customer-analytics', label: 'Customer Analytics', icon: Users2, category: 'Marketplace' },
  { id: 'payment-analytics', label: 'Payment Analytics', icon: Banknote, category: 'Marketplace' },
  { id: 'referral-analytics', label: 'Referral Analytics', icon: GitBranch, category: 'Marketplace' },

  // Customization
  { id: 'branding', label: 'Branding', icon: Palette, category: 'Customization' },
  { id: 'maps', label: 'Maps', icon: Map, category: 'Customization' },

  // Integrations
  { id: 'api-integrations', label: 'API Integrations', icon: Plug, category: 'Integrations' },
  { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, category: 'Integrations' },

  // Monitoring
  { id: 'health', label: 'Health', icon: Activity, category: 'Monitoring' },

  // Data Management
  { id: 'data-management', label: 'Data Management', icon: Database, category: 'Data' },
  { id: 'csv-import', label: 'CSV Import', icon: FileSpreadsheet, category: 'Data' },
  { id: 'user-management', label: 'User Management', icon: UserCog, category: 'Data' },

  // Communications
  { id: 'email-triggers', label: 'Email Triggers', icon: Mail, category: 'Communications' },
  { id: 'advanced-email', label: 'Advanced Email', icon: MessageSquare, category: 'Communications' },
  { id: 'smtp-guide', label: 'SMTP Guide', icon: Send, category: 'Communications' },
  { id: 'sms-logs', label: 'SMS Logs', icon: Smartphone, category: 'Communications' },
  { id: 'sms-delivery', label: 'SMS Delivery', icon: Globe, category: 'Communications' },
];

const categories = [
  'Core',
  'GP51',
  'Business',
  'Finance',
  'Marketplace',
  'Customization',
  'Integrations',
  'Monitoring',
  'Data',
  'Communications'
];

interface StableSettingsSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const StableSettingsSidebar: React.FC<StableSettingsSidebarProps> = memo(({ 
  activeTab, 
  onTabChange 
}) => {
  return (
    <div className="w-64 bg-white border-r border-gray-200 overflow-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Settings</h2>
        
        <div className="space-y-6">
          {categories.map((category) => {
            const categoryItems = sidebarItems.filter(item => item.category === category);
            
            if (categoryItems.length === 0) return null;
            
            return (
              <div key={category}>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  {category}
                </h3>
                <div className="space-y-1">
                  {categoryItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className={`
                          w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                          ${isActive 
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }
                        `}
                      >
                        <Icon className={`mr-3 h-4 w-4 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

StableSettingsSidebar.displayName = 'StableSettingsSidebar';

export default StableSettingsSidebar;
