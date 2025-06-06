
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Building2, CreditCard, Bell, Settings as SettingsIcon, Mail, Palette } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import CompanySettingsTab from "@/components/settings/CompanySettingsTab";
import FleetUserManagementTab from "@/components/settings/FleetUserManagementTab";
import BillingSettingsTab from "@/components/settings/BillingSettingsTab";
import NotificationsSettingsTab from "@/components/settings/NotificationsSettingsTab";
import GP51ApiSettingsTab from "@/components/settings/GP51ApiSettingsTab";
import EnhancedSMTPSettingsTab from "@/components/settings/EnhancedSMTPSettingsTab";
import BrandingCustomizationTab from "@/components/settings/BrandingCustomizationTab";
import AdminSettings from "@/components/AdminSettings";

const Settings = () => {
  const { user, isAdmin, userRole } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Settings & Configurations</h1>
          <p className="text-gray-600 mt-1">
            Manage your Envio GPS tracking platform settings and customizations
          </p>
        </div>
      </div>

      {/* User Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <div className="mt-1 text-sm text-gray-900">{user?.email}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Role</label>
            <div className="mt-1">
              <Badge variant={userRole === 'admin' ? 'default' : 'secondary'}>
                {userRole === 'admin' ? 'Administrator' : 'User'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="gp51" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            GPS51 API
          </TabsTrigger>
          <TabsTrigger value="smtp" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Branding
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <CompanySettingsTab />
        </TabsContent>

        <TabsContent value="users">
          <FleetUserManagementTab />
        </TabsContent>

        <TabsContent value="billing">
          <BillingSettingsTab />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsSettingsTab />
        </TabsContent>

        <TabsContent value="gp51">
          <GP51ApiSettingsTab />
        </TabsContent>

        <TabsContent value="smtp">
          <EnhancedSMTPSettingsTab />
        </TabsContent>

        <TabsContent value="branding">
          <BrandingCustomizationTab />
        </TabsContent>
      </Tabs>

      {/* Admin-Only Advanced Settings */}
      {isAdmin && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Advanced Administration</h2>
          <AdminSettings />
        </div>
      )}

      {!isAdmin && (
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="pt-6">
            <p className="text-gray-600 text-center">
              Advanced administration settings are available to administrators only.
              Contact your system administrator for access to advanced platform configuration.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Settings;
