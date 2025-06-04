
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Car, Settings, Shield, Activity, BarChart3 } from "lucide-react";
import Layout from "@/components/Layout";

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

  const dashboardCards = [
    {
      title: "Fleet Dashboard",
      description: "Real-time insights and monitoring for your fleet",
      icon: BarChart3,
      href: "/dashboard",
      adminOnly: false,
      featured: true,
    },
    {
      title: "User Management",
      description: "Manage Envio users and their roles",
      icon: Users,
      href: "/users",
      adminOnly: true,
    },
    {
      title: "Vehicle Management",
      description: "View and manage tracked vehicles",
      icon: Car,
      href: "/vehicles",
      adminOnly: false,
    },
    {
      title: "System Monitoring",
      description: "Monitor real-time data synchronization and system health",
      icon: Activity,
      href: "/monitoring",
      adminOnly: true,
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
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {dashboardCards
            .filter(card => !card.adminOnly || isAdmin)
            .map((card) => {
              const Icon = card.icon;
              return (
                <Card 
                  key={card.href} 
                  className={`hover:shadow-lg transition-shadow cursor-pointer ${
                    card.featured ? 'border-blue-200 bg-blue-50' : ''
                  }`}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-6 w-6" />
                      {card.title}
                      {card.adminOnly && (
                        <Badge variant="outline" className="text-xs">
                          Admin
                        </Badge>
                      )}
                      {card.featured && (
                        <Badge variant="default" className="text-xs">
                          Featured
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{card.description}</p>
                    <Button 
                      onClick={() => navigate(card.href)}
                      className="w-full"
                      variant={card.featured ? "default" : "outline"}
                    >
                      Open
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
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
                user management, system monitoring, GP51 credential configuration, and other sensitive system settings.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Index;
