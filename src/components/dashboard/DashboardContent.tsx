
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminGP51Auth } from '@/hooks/useAdminGP51Auth';
import AdminDashboard from '@/components/admin/AdminDashboard';
import DashboardHeader from './DashboardHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Car, 
  MapPin, 
  Clock, 
  Activity, 
  TrendingUp, 
  Shield,
  RefreshCw,
  CheckCircle 
} from 'lucide-react';

export const DashboardContent: React.FC = () => {
  const { user } = useAuth();
  const { isAdminUser, isLoading, isAuthenticated, error } = useAdminGP51Auth();

  // Admin user gets the admin dashboard
  if (isAdminUser) {
    return (
      <div className="space-y-6">
        <DashboardHeader />
        
        {/* Admin Authentication Status */}
        {isLoading && (
          <Alert>
            <RefreshCw className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Configuring admin access... Setting up GP51 integration...
            </AlertDescription>
          </Alert>
        )}

        {isAuthenticated ? (
          <AdminDashboard />
        ) : error ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Shield className="h-5 w-5" />
                GP51 Integration Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
              <AdminDashboard />
            </CardContent>
          </Card>
        ) : !isLoading && (
          <AdminDashboard />
        )}
      </div>
    );
  }

  // Regular user dashboard
  return (
    <div className="space-y-6">
      <DashboardHeader />
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+0%</span> from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+0%</span> from last hour
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distance Today</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-- km</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+0%</span> from yesterday
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Trip Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-- min</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+0%</span> from last week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* GP51 Setup Required Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>GP51 Integration Required:</strong> Please contact your administrator to configure GP51 connectivity for real-time vehicle tracking.
        </AlertDescription>
      </Alert>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest vehicle tracking events and system updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">System Initialized</p>
                <p className="text-xs text-muted-foreground">FleetIQ dashboard is ready for configuration</p>
              </div>
              <Badge variant="secondary">Just now</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
