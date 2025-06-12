
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGP51SessionStatus } from '@/hooks/useGP51SessionStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertTriangle, 
  Settings, 
  Zap,
  User,
  Database
} from 'lucide-react';
import { Link } from 'react-router-dom';
import SimpleDashboardContent from './SimpleDashboardContent';
import GP51SetupWizard from './GP51SetupWizard';

const AuthenticatedDashboard: React.FC = () => {
  const { user } = useAuth();
  const { 
    isGP51Authenticated, 
    isLoading: gp51Loading, 
    error: gp51Error,
    sessionInfo 
  } = useGP51SessionStatus();

  // Show loading while checking GP51 status
  if (gp51Loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Checking system status...</p>
        </div>
      </div>
    );
  }

  // Authentication Status Component
  const AuthenticationStatus = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          System Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Supabase Authentication Status */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-medium">Supabase Authentication</div>
                <div className="text-sm text-muted-foreground">
                  Logged in as {user?.email}
                </div>
              </div>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800">
              Connected
            </Badge>
          </div>

          {/* GP51 Authentication Status */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              {isGP51Authenticated ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              )}
              <div>
                <div className="font-medium">GP51 Integration</div>
                <div className="text-sm text-muted-foreground">
                  {isGP51Authenticated 
                    ? `Connected as ${sessionInfo?.username}` 
                    : 'Not configured - required for vehicle data'
                  }
                </div>
              </div>
            </div>
            <Badge 
              variant={isGP51Authenticated ? "default" : "secondary"}
              className={isGP51Authenticated 
                ? "bg-green-100 text-green-800" 
                : "bg-orange-100 text-orange-800"
              }
            >
              {isGP51Authenticated ? 'Connected' : 'Setup Required'}
            </Badge>
          </div>
        </div>

        {/* Error Message */}
        {gp51Error && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              GP51 Connection Issue: {gp51Error}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  // If GP51 is not authenticated, show setup flow
  if (!isGP51Authenticated) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome to Fleet Management</h1>
            <p className="text-gray-600 mt-1">
              Complete the setup to start monitoring your vehicles
            </p>
          </div>
        </div>

        <AuthenticationStatus />

        {/* Setup Required Alert */}
        <Alert>
          <Zap className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                GP51 integration setup is required to access vehicle data and tracking features.
              </span>
              <div className="flex gap-2">
                <Button asChild size="sm">
                  <Link to="/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Go to Settings
                  </Link>
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Setup Wizard */}
        <GP51SetupWizard />

        {/* Preview Dashboard (Limited) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Dashboard Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-gray-400">--</div>
                  <div className="text-sm">Total Vehicles</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-gray-400">--</div>
                  <div className="text-sm">Online Vehicles</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-gray-400">--</div>
                  <div className="text-sm">Active Alerts</div>
                </div>
              </div>
              <p>Vehicle data and analytics will appear here once GP51 integration is configured.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If GP51 is authenticated, show full dashboard
  return (
    <div className="space-y-6">
      <AuthenticationStatus />
      <SimpleDashboardContent />
    </div>
  );
};

export default AuthenticatedDashboard;
