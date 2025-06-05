
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Car, Settings, Shield } from "lucide-react";
import UnifiedDashboard from "@/components/UnifiedDashboard";

const Index = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  const quickActions = [
    {
      title: "User Management",
      description: "Manage Envio users and their roles",
      icon: Users,
      href: "/user-management",
      adminOnly: true,
    },
    {
      title: "Vehicle Management",
      description: "Advanced vehicle and device management",
      icon: Car,
      href: "/vehicle-management",
      adminOnly: false,
    },
    {
      title: "Settings",
      description: "Configure system settings and integrations",
      icon: Settings,
      href: "/settings",
      adminOnly: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Envio Fleet Management</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user.email}
            {isAdmin && (
              <Badge variant="secondary" className="ml-2">
                <Shield className="h-3 w-3 mr-1" />
                Administrator
              </Badge>
            )}
          </p>
        </div>
      </div>

      {/* Unified Dashboard */}
      <UnifiedDashboard />

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {quickActions
            .filter(action => !action.adminOnly || isAdmin)
            .map((action) => {
              const Icon = action.icon;
              return (
                <Card 
                  key={action.href} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      {action.title}
                      {action.adminOnly && (
                        <Badge variant="outline" className="text-xs">
                          Admin
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{action.description}</p>
                    <Button 
                      onClick={() => navigate(action.href)}
                      className="w-full"
                      size="sm"
                    >
                      Open
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </div>

      {isAdmin && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Shield className="h-5 w-5" />
              Administrator Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700">
              You have administrator privileges in the Envio console. This grants you access to 
              user management, GP51 credential configuration, and other sensitive system settings.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Index;
