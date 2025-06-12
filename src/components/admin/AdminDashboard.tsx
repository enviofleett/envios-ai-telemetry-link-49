
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAdminGP51Auth } from '@/hooks/useAdminGP51Auth';
import { Shield, CheckCircle, XCircle, RefreshCw, Settings, User, Activity } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { 
    isLoading, 
    isAuthenticated, 
    error, 
    username, 
    isAdminUser,
    authenticateAdmin,
    resetAuth 
  } = useAdminGP51Auth();

  if (!isAdminUser) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              You do not have administrative privileges.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Dashboard
          </CardTitle>
          <CardDescription>
            Administrative control panel for FleetIQ GPS51 integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* GP51 Authentication Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {isLoading ? (
                <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
              ) : isAuthenticated ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <div>
                <p className="font-medium">
                  GP51 Integration Status
                </p>
                <p className="text-sm text-muted-foreground">
                  {isLoading ? 'Configuring...' : 
                   isAuthenticated ? `Connected as: ${username}` : 
                   'Not connected'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={isAuthenticated ? "default" : "secondary"}>
                {isAuthenticated ? 'Active' : 'Inactive'}
              </Badge>
              {!isLoading && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isAuthenticated ? resetAuth : authenticateAdmin}
                  disabled={isLoading}
                >
                  {isAuthenticated ? 'Disconnect' : 'Connect'}
                </Button>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>GP51 Authentication Error:</strong> {error}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2"
                  onClick={authenticateAdmin}
                  disabled={isLoading}
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {isAuthenticated && !error && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                GP51 integration is active and ready. You now have full access to the FleetIQ dashboard.
              </AlertDescription>
            </Alert>
          )}

          {/* Admin Tools */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage user accounts and permissions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  System Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Configure system-wide settings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View system health and logs
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
