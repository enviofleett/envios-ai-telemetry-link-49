
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import AdminSettings from "@/components/AdminSettings";

const Settings = () => {
  const { user, isAdmin, userRole } = useAuth();

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your account and system configuration
          </p>
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

        {/* Admin-Only Settings */}
        {isAdmin && <AdminSettings />}

        {!isAdmin && (
          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="pt-6">
              <p className="text-gray-600 text-center">
                Additional settings are available to administrators only.
                Contact your system administrator for access to GP51 platform configuration.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Settings;
