
import React from 'react';
import { cn } from '@/lib/utils';
import { 
  Building2, 
  Palette, 
  DollarSign, 
  Users, 
  FileText, 
  Mail, 
  MessageSquare,
  Database,
  Bell,
  Settings,
  Shield,
  MapPin,
  Zap,
  BarChart3,
  Package
} from 'lucide-react';

interface SettingsSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const sidebarItems = [
  {
    category: 'Company',
    items: [
      { id: 'company', label: 'Company Info', icon: Building2 },
      { id: 'branding', label: 'Branding', icon: Palette },
      { id: 'currency', label: 'Currency', icon: DollarSign },
    ]
  },
  {
    category: 'User Management',
    items: [
      { id: 'users', label: 'Users', icon: Users },
      { id: 'billing', label: 'Billing', icon: FileText },
    ]
  },
  {
    category: 'Communication',
    items: [
      { id: 'email-templates', label: 'Email Templates', icon: Mail },
      { id: 'email-queue', label: 'Email Queue', icon: Mail },
      { id: 'sms-settings', label: 'SMS Gateway', icon: MessageSquare },
      { id: 'sms-logs', label: 'SMS Logs', icon: MessageSquare },
    ]
  },
  {
    category: 'System',
    items: [
      { id: 'health', label: 'System Health', icon: Database },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'system', label: 'System Settings', icon: Settings },
      { id: 'security', label: 'Security', icon: Shield },
    ]
  },
  {
    category: 'Integration',
    items: [
      { id: 'gp51', label: 'GP51 Integration', icon: MapPin },
      { id: 'geofencing', label: 'Geofencing', icon: MapPin },
    ]
  },
  {
    category: 'Analytics',
    items: [
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'packages', label: 'Packages', icon: Package },
    ]
  }
];

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
        
        <nav className="space-y-6">
          {sidebarItems.map((category) => (
            <div key={category.category}>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                {category.category}
              </h3>
              <ul className="space-y-1">
                {category.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => onTabChange(item.id)}
                        className={cn(
                          "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                          activeTab === item.id
                            ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        )}
                      >
                        <Icon className="h-4 w-4 mr-3" />
                        {item.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default SettingsSidebar;
