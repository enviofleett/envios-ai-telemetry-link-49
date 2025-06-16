
import React, { memo } from 'react';
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
  Package,
  Send,
  Inbox,
  Upload,
  Car,
  Map,
  MessageCircle,
  CheckCircle,
  BookOpen,
  Link,
  UserCheck
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
      { id: 'registration-management', label: 'Registration Management', icon: UserCheck },
      { id: 'billing', label: 'Billing', icon: FileText },
      { id: 'workshops', label: 'Workshops', icon: Users },
    ]
  },
  {
    category: 'Communication',
    items: [
      { id: 'email-templates', label: 'Email Templates', icon: Mail },
      { id: 'email-triggers', label: 'Email Triggers', icon: Zap },
      { id: 'email-queue', label: 'Email Queue', icon: Inbox },
      { id: 'advanced-email', label: 'Advanced Email', icon: Send },
      { id: 'smtp-guide', label: 'SMTP Guide', icon: BookOpen },
      { id: 'sms-settings', label: 'SMS Gateway', icon: MessageSquare },
      { id: 'sms-logs', label: 'SMS Logs', icon: MessageSquare },
    ]
  },
  {
    category: 'API Integrations',
    items: [
      { id: 'vin-api', label: 'VIN API', icon: Car },
      { id: 'maps', label: 'Maps API', icon: Map },
      { id: 'whatsapp-api', label: 'WhatsApp API', icon: MessageCircle },
      { id: 'api-integrations', label: 'API Management', icon: Link },
    ]
  },
  {
    category: 'Data Management',
    items: [
      { id: 'csv-import', label: 'CSV Import', icon: Upload },
      { id: 'data-management', label: 'Data Management', icon: Database },
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
      { id: 'gp51-validation', label: 'GP51 Validation', icon: CheckCircle },
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

const SettingsSidebar: React.FC<SettingsSidebarProps> = memo(({ activeTab, onTabChange }) => {
  const handleItemClick = React.useCallback((itemId: string) => {
    onTabChange(itemId);
  }, [onTabChange]);

  return (
    <div className="bg-card border rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4">Settings</h2>
      
      <nav className="space-y-4">
        {sidebarItems.map((category) => (
          <div key={category.category}>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              {category.category}
            </h3>
            <ul className="space-y-1">
              {category.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleItemClick(item.id)}
                      className={cn(
                        "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        activeTab === item.id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
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
  );
});

SettingsSidebar.displayName = 'SettingsSidebar';

export default SettingsSidebar;
