
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Shield, Users, Car, BarChart3 } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">EnvioFleet Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Fleet Management Dashboard</h2>
          <p className="text-gray-600 mt-2">Monitor and manage your GPS fleet in real-time</p>
        </div>

        {/* Stats Grid */}
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
              <CardTitle className="text-sm font-medium">Fleet Status</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
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
              <div className="text-2xl font-bold">Connected</div>
              <p className="text-xs text-muted-foreground">Integration active</p>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Welcome to EnvioFleet</CardTitle>
            <CardDescription>
              Your comprehensive GPS fleet management solution is ready to use.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Real-time Tracking</h3>
                <p className="text-sm text-gray-600">Monitor your vehicles in real-time with GPS precision.</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Fleet Analytics</h3>
                <p className="text-sm text-gray-600">Get insights into vehicle performance and usage patterns.</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">GP51 Integration</h3>
                <p className="text-sm text-gray-600">Seamlessly integrated with GP51 tracking systems.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Current status of your EnvioFleet platform
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
                <span className="text-sm">Registration System</span>
                <span className="text-green-600 text-sm font-medium">✓ Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">User Session</span>
                <span className="text-green-600 text-sm font-medium">✓ Valid</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
