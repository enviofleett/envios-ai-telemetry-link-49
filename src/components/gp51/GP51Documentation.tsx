
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BookOpen, 
  Shield, 
  Zap, 
  Database, 
  Settings, 
  Users,
  CheckCircle,
  Info,
  ExternalLink
} from 'lucide-react';

export const GP51Documentation: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            GP51 Integration Documentation
          </CardTitle>
          <CardDescription>
            Complete guide to using GP51 integration features and troubleshooting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Getting Started:</strong> This integration connects your application to the GP51 tracking platform 
              for real-time vehicle monitoring and fleet management.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Authentication Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Required Information:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• GP51 username (case-sensitive)</li>
                    <li>• GP51 password</li>
                    <li>• API URL (optional - uses default if empty)</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Setup Steps:</h4>
                  <ol className="text-sm space-y-1 text-muted-foreground">
                    <li>1. Go to Admin Settings → GP51 Integration</li>
                    <li>2. Enter your GP51 credentials</li>
                    <li>3. Click "Test Connection" to verify</li>
                    <li>4. Save credentials once verified</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Real-time Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Available Features:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Live vehicle position tracking</li>
                    <li>• Automatic session management</li>
                    <li>• Connection health monitoring</li>
                    <li>• Real-time status indicators</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Status Indicators:</h4>
                  <div className="flex gap-1 flex-wrap">
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-800">Live Updates</Badge>
                    <Badge variant="destructive">Disconnected</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Data Synchronization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Sync Process:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Automatic vehicle discovery</li>
                    <li>• Position data updates every 30 seconds</li>
                    <li>• Device status monitoring</li>
                    <li>• Historical data import capabilities</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Manual Controls:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Force sync in Admin Settings</li>
                    <li>• Connection testing tools</li>
                    <li>• Health check validation</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Configuration Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Customizable Settings:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Sync interval (15s to 5 minutes)</li>
                    <li>• Retry attempts (1-10)</li>
                    <li>• Auto device discovery toggle</li>
                    <li>• Real-time updates enable/disable</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">API URL Options:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Default: https://www.gps51.com</li>
                    <li>• Custom URLs supported</li>
                    <li>• Automatic fallback mechanisms</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-4 w-4" />
                Security & Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium">Security Features:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Credentials encrypted at rest (AES-256)</li>
                    <li>• Secure session management</li>
                    <li>• Access logging and monitoring</li>
                    <li>• Automatic session refresh</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Best Practices:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Use strong, unique passwords</li>
                    <li>• Test connections regularly</li>
                    <li>• Monitor session expiration</li>
                    <li>• Keep API URLs updated</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available Admin Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="p-3 border rounded">
                  <h4 className="font-medium">Connection Testing</h4>
                  <p className="text-sm text-muted-foreground">
                    Validate GP51 credentials and test API connectivity
                  </p>
                </div>
                <div className="p-3 border rounded">
                  <h4 className="font-medium">Health Monitoring</h4>
                  <p className="text-sm text-muted-foreground">
                    Real-time session health and connection status
                  </p>
                </div>
                <div className="p-3 border rounded">
                  <h4 className="font-medium">Validation Suite</h4>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive testing of all integration components
                  </p>
                </div>
                <div className="p-3 border rounded">
                  <h4 className="font-medium">Troubleshooting Guide</h4>
                  <p className="text-sm text-muted-foreground">
                    Step-by-step solutions for common issues
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <ExternalLink className="h-4 w-4" />
            <AlertDescription>
              <strong>Need More Help?</strong> Visit the GP51 official documentation or contact your 
              system administrator for additional support and advanced configuration options.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
