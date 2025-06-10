
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Users, 
  FileText, 
  Settings, 
  Bell,
  Shield,
  Wifi,
  WifiOff 
} from 'lucide-react';
import { useWorkshopActivity, useFormTemplates } from '@/hooks/useWorkshopRealtime';
import { useOptimisticUpdates } from '@/hooks/useOptimisticUpdates';
import { WorkshopPermissionService } from '@/services/workshop/WorkshopPermissionService';
import { useToast } from '@/hooks/use-toast';

interface WorkshopDashboardProps {
  workshopId: string;
  currentUser: any;
}

const WorkshopDashboard: React.FC<WorkshopDashboardProps> = ({ 
  workshopId, 
  currentUser 
}) => {
  const { toast } = useToast();
  const { activities, isConnected, logActivity } = useWorkshopActivity(workshopId);
  const { templates } = useFormTemplates(workshopId);
  const [permissions, setPermissions] = useState<string[]>([]);
  
  const {
    data: workshopData,
    optimisticUpdate,
    syncWithServer
  } = useOptimisticUpdates(`workshop_${workshopId}`, null);

  useEffect(() => {
    // Load user permissions
    const loadPermissions = async () => {
      if (currentUser?.id) {
        const userPermissions = await WorkshopPermissionService.getUserPermissions(currentUser.id);
        setPermissions(userPermissions);
      }
    };

    loadPermissions();

    // Log user login activity
    if (currentUser?.id) {
      logActivity({
        activityType: 'user_login',
        entityType: 'workshop_user',
        entityId: currentUser.id,
        activityData: {
          userName: currentUser.name,
          role: currentUser.role
        },
        userId: currentUser.id
      });
    }
  }, [currentUser, logActivity]);

  const handleUpdateWorkshopSettings = async (newSettings: any) => {
    try {
      await optimisticUpdate(
        (current) => ({ ...current, ...newSettings }),
        async () => {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Log settings change
          await logActivity({
            activityType: 'settings_changed',
            entityType: 'workshop',
            entityId: workshopId,
            activityData: { changedSettings: Object.keys(newSettings) },
            userId: currentUser?.id
          });
          
          return { ...workshopData, ...newSettings };
        }
      );

      toast({
        title: "Settings Updated",
        description: "Workshop settings have been updated successfully."
      });
    } catch (error) {
      toast({
        title: "Update Failed", 
        description: "Failed to update workshop settings.",
        variant: "destructive"
      });
    }
  };

  const canManageSettings = permissions.includes('manage_settings');
  const canViewTransactions = permissions.includes('view_transactions');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Workshop Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {currentUser?.name}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
          <Badge variant="secondary">
            <Shield className="h-3 w-3 mr-1" />
            {currentUser?.role}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Templates
                </p>
                <p className="text-2xl font-bold">{templates.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Recent Activities
                </p>
                <p className="text-2xl font-bold">{activities.length}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Permissions
                </p>
                <p className="text-2xl font-bold">{permissions.length}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Connection Status
                </p>
                <p className="text-sm font-medium text-green-600">
                  {isConnected ? 'Real-time' : 'Offline'}
                </p>
              </div>
              <Bell className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="activity" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="activity">Activity Feed</TabsTrigger>
          <TabsTrigger value="templates">Form Templates</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="settings" disabled={!canManageSettings}>
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activities.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No recent activity
                  </p>
                ) : (
                  activities.slice(0, 10).map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{activity.activity_type}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {activity.entity_type}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Inspection Form Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {templates.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No templates available
                  </p>
                ) : (
                  templates.map((template) => (
                    <div key={template.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{template.template_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {template.template_description}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {template.is_default && (
                          <Badge variant="default">Default</Badge>
                        )}
                        <Badge variant={template.is_active ? "success" : "secondary"}>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Your Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {permissions.map((permission) => (
                  <Badge key={permission} variant="outline" className="justify-center">
                    {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Workshop Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  onClick={() => handleUpdateWorkshopSettings({ 
                    lastUpdated: new Date().toISOString() 
                  })}
                  disabled={!canManageSettings}
                >
                  Update Settings
                </Button>
                <p className="text-sm text-muted-foreground">
                  Settings management interface would go here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkshopDashboard;
