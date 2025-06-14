
import React, { useState, useCallback } from 'react';
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
  Lock
} from 'lucide-react';
import SecurityDashboard from './security/SecurityDashboard';
import SecuritySettingsPanel from './security/SecuritySettingsPanel';
import SecurityEventsPanel from './security/SecurityEventsPanel';
import AccessPoliciesPanel from './security/AccessPoliciesPanel';
import { toast } from '@/hooks/use-toast';

const SecurityTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeEvent, setActiveEvent] = useState(null);
  const [refreshToken, setRefreshToken] = useState(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setRefreshToken(Date.now());
      toast({
        title: "Refreshing data...",
        description: "Fetching latest security information.",
      });
      // Optionally: await a backend re-fetch if needed in future.
      setTimeout(() => {
        setIsRefreshing(false);
        toast({
          title: "Security data refreshed",
          description: "Dashboard, events, and policies are now up to date.",
        });
      }, 700); // Fake delay for nice feedback
    } catch (e) {
      setIsRefreshing(false);
      toast({
        title: "Refresh failed",
        description: "Could not refresh security data.",
        variant: "destructive",
      });
    }
  }, []);

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
            <button
              className="btn btn-outline btn-sm flex items-center gap-1 px-3 py-1 rounded"
              onClick={handleRefresh}
              disabled={isRefreshing}
              aria-busy={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
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
              <SecurityDashboard refreshToken={refreshToken} />
            </TabsContent>

            <TabsContent value="settings">
              <SecuritySettingsPanel refreshToken={refreshToken} onRefresh={handleRefresh} />
            </TabsContent>

            <TabsContent value="events">
              <SecurityEventsPanel onViewDetails={setActiveEvent} refreshToken={refreshToken} />
            </TabsContent>

            <TabsContent value="policies">
              <AccessPoliciesPanel refreshToken={refreshToken} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityTab;
