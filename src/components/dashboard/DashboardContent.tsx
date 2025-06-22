
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Car, Users, MapPin, Settings, BarChart3, Shield, Activity } from 'lucide-react';
import GP51HealthIndicator from '@/components/admin/GP51HealthIndicator';

const DashboardContent: React.FC = () => {
  const { user, isAdmin } = useUnifiedAuth();

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome to EnvioFleet</h1>
        <p className="text-gray-600 mt-2">
          {user?.email ? `Welcome back, ${user.email}` : 'Intelligent Fleet Management Platform'}
        </p>
      </div>

      {/* GP51 Health Status */}
      <div className="mb-8">
        <GP51HealthIndicator />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No vehicles added yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">You are logged in</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Tracking</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Ready</div>
            <p className="text-xs text-muted-foreground">System operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GP51 Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Setup Required</div>
            <p className="text-xs text-muted-foreground">Complete authentication</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Live Tracking
            </CardTitle>
            <CardDescription>
              Monitor vehicle locations in real-time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/tracking">
              <Button className="w-full">
                View Live Map
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Car className="h-5 w-5 mr-2" />
              Vehicle Management
            </CardTitle>
            <CardDescription>
              Add and manage your fleet vehicles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/vehicles">
              <Button className="w-full">
                Manage Fleet
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Reports
            </CardTitle>
            <CardDescription>
              Generate comprehensive fleet reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/reports">
              <Button className="w-full">
                View Reports
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Setup Instructions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Get Started with EnvioFleet</CardTitle>
          <CardDescription>
            Follow these steps to set up your fleet management system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                1. Configure GP51 Integration
              </h3>
              <p className="text-sm text-gray-600 mb-3">Connect to the GP51 platform for vehicle tracking.</p>
              <Link to="/settings">
                <Button size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Open Settings
                </Button>
              </Link>
            </div>
            
            <div className="p-4 border rounded-lg opacity-50">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <Car className="h-4 w-4 mr-2" />
                2. Add Vehicles
              </h3>
              <p className="text-sm text-gray-600 mb-3">Import or add vehicles to your fleet.</p>
              <Button size="sm" disabled>
                Add Vehicles
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              System Status
            </CardTitle>
            <CardDescription>
              Current status of the EnvioFleet platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Authentication System</span>
                <span className="text-green-600 text-sm font-medium">✓ Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database Connection</span>
                <span className="text-green-600 text-sm font-medium">✓ Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">User Session</span>
                <span className="text-green-600 text-sm font-medium">✓ Valid</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">GP51 Integration</span>
                <span className="text-yellow-600 text-sm font-medium">⚠ Setup Required</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardContent;
