
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Package, 
  Upload, 
  Building, 
  CreditCard, 
  Users, 
  Bell, 
  Plug, 
  Activity, 
  Map, 
  BarChart3, 
  Shield, 
  Mail, 
  CheckSquare,
  Settings,
  MailOpen,
  Wrench,
  FileText,
  Inbox
} from 'lucide-react';

interface SettingsSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const settingsCategories = [
  {
    title: "System",
    items: [
      { id: "packages", label: "Packages", icon: Package },
      { id: "csv-import", label: "CSV Import", icon: Upload },
      { id: "health", label: "System Health", icon: Activity },
    ]
  },
  {
    title: "Company & Users",
    items: [
      { id: "company", label: "Company Settings", icon: Building },
      { id: "users", label: "User Management", icon: Users },
      { id: "billing", label: "Billing", icon: CreditCard },
    ]
  },
  {
    title: "Services & Workshops",
    items: [
      { id: "workshops", label: "Workshop Management", icon: Wrench },
    ]
  },
  {
    title: "Integrations",
    items: [
      { id: "maps", label: "Maps & Geocoding", icon: Map },
      { id: "gp51-integration", label: "GP51 Integration", icon: Plug },
    ]
  },
  {
    title: "Email Management",
    items: [
      { id: "smtp", label: "SMTP Configuration", icon: Mail },
      { id: "email-templates", label: "Email Templates", icon: FileText },
      { id: "email-queue", label: "Email Queue", icon: Inbox },
      { id: "smtp-guide", label: "SMTP Setup Guide", icon: Settings },
    ]
  },
  {
    title: "Analytics & Monitoring",
    items: [
      { id: "analytics", label: "Analytics", icon: BarChart3 },
      { id: "geofencing", label: "Geofencing", icon: Shield },
      { id: "gp51-validation", label: "GP51 Validation", icon: CheckSquare },
    ]
  },
  {
    title: "Communication",
    items: [
      { id: "notifications", label: "Notifications", icon: Bell },
      { id: "email-notifications", label: "Email Preferences", icon: MailOpen },
    ]
  }
];

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="w-64 border-r bg-muted/10">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">System Administration</p>
      </div>
      
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-6">
          {settingsCategories.map((category) => (
            <div key={category.title} className="space-y-2">
              <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {category.title}
              </h3>
              <div className="space-y-1">
                {category.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant={activeTab === item.id ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start h-9 px-2",
                        activeTab === item.id && "bg-secondary/80 font-medium"
                      )}
                      onClick={() => onTabChange(item.id)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
