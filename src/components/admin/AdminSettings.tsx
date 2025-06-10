
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Settings, 
  Database, 
  Building2, 
  Mail, 
  Shield,
  BarChart3,
  Wrench
} from 'lucide-react';

// Import existing components
import UsersTab from './tabs/UsersTab';
import WorkshopsTab from './tabs/WorkshopsTab';
import SMTPTab from './tabs/SMTPTab';
import HealthTab from './tabs/HealthTab';
import AnalyticsTab from './tabs/AnalyticsTab';
import GP51IntegrationTab from './tabs/GP51IntegrationTab';

// Import new enhanced component
import AdminWorkshopManagementEnhanced from './AdminWorkshopManagementEnhanced';

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');

  const tabs = [
    {
      id: 'users',
      label: 'Users',
      icon: Users,
      component: UsersTab
    },
    {
      id: 'workshops-enhanced',
      label: 'Workshop Management',
      icon: Building2,
      component: AdminWorkshopManagementEnhanced,
      badge: 'New'
    },
    {
      id: 'workshops',
      label: 'Workshops (Legacy)',
      icon: Wrench,
      component: WorkshopsTab
    },
    {
      id: 'smtp',
      label: 'Email Settings',
      icon: Mail,
      component: SMTPTab
    },
    {
      id: 'health',
      label: 'System Health',
      icon: Shield,
      component: HealthTab
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      component: AnalyticsTab
    },
    {
      id: 'gp51',
      label: 'GP51 Integration',
      icon: Database,
      component: GP51IntegrationTab
    }
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);
  const ActiveComponent = activeTabData?.component;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          <p className="text-muted-foreground">
            Manage system settings and configurations
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          {tabs.map((tab) => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id}
              className="flex items-center gap-2"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.badge && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {tab.badge}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="space-y-6">
            {ActiveComponent && tab.id === activeTab && <ActiveComponent />}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AdminSettings;
