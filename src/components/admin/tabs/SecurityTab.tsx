
import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  RefreshCw,
  Bell,
  Users,
  Settings,
  FileText,
  AlertTriangle,
  Lock
} from 'lucide-react';
import SecurityDashboard from './security/SecurityDashboard';
import SecuritySettingsPanel from './security/SecuritySettingsPanel';
import SecurityEventsPanel from './security/SecurityEventsPanel';
import AccessPoliciesPanel from './security/AccessPoliciesPanel';

const SecurityTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Store active event for details dialog (populated by EventsPanel)
  const [activeEvent, setActiveEvent] = useState(null);

  // Quick actions for settings, future refresh logic can be added here.

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Management
              </CardTitle>
              <CardDescription>
                Monitor and configure your system’s security settings, view live security events, and manage access policies.
              </CardDescription>
            </div>
            <button className="btn btn-outline btn-sm" disabled>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
            <TabsList>
              <TabsTrigger value="dashboard">
                <Settings className="h-4 w-4 mr-1" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Lock className="h-4 w-4 mr-1" />
                Security Settings
              </TabsTrigger>
              <TabsTrigger value="events">
                <Bell className="h-4 w-4 mr-1" />
                Events
              </TabsTrigger>
              <TabsTrigger value="policies">
                <Users className="h-4 w-4 mr-1" />
                Access Policies
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <SecurityDashboard />
            </TabsContent>

            <TabsContent value="settings">
              <SecuritySettingsPanel />
            </TabsContent>

            <TabsContent value="events">
              <SecurityEventsPanel onViewDetails={setActiveEvent} />
            </TabsContent>

            <TabsContent value="policies">
              <AccessPoliciesPanel />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityTab;
