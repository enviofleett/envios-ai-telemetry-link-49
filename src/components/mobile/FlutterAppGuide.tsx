
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Download, Code, Database, Shield, Zap } from 'lucide-react';

const FlutterAppGuide: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5 text-blue-600" />
            <CardTitle>Flutter Mobile App Development Guide</CardTitle>
          </div>
          <CardDescription>
            Complete guide for developing the Flutter mobile app with GP51 integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center p-4 bg-blue-50 rounded-lg">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <div className="font-semibold text-blue-800">Secure Auth</div>
                <div className="text-sm text-blue-600">Supabase integration</div>
              </div>
            </div>
            <div className="flex items-center p-4 bg-green-50 rounded-lg">
              <Database className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <div className="font-semibold text-green-800">Real-time Data</div>
                <div className="text-sm text-green-600">Live vehicle tracking</div>
              </div>
            </div>
            <div className="flex items-center p-4 bg-purple-50 rounded-lg">
              <Zap className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <div className="font-semibold text-purple-800">Offline Support</div>
                <div className="text-sm text-purple-600">Cached data access</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Development Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm">1. Flutter Dependencies</h4>
                <code className="text-xs text-gray-600 block mt-1">
                  supabase_flutter: ^2.0.0<br/>
                  geolocator: ^10.0.0<br/>
                  google_maps_flutter: ^2.0.0<br/>
                  flutter_secure_storage: ^9.0.0
                </code>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm">2. Supabase Configuration</h4>
                <code className="text-xs text-gray-600 block mt-1">
                  URL: https://bjkqxmvjuewshomihjqm.supabase.co<br/>
                  Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
                </code>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm">3. Authentication Flow</h4>
                <ul className="text-xs text-gray-600 mt-1 space-y-1">
                  <li>• GP51 username/password login</li>
                  <li>• Secure session management</li>
                  <li>• Automatic token refresh</li>
                  <li>• Biometric authentication support</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Architecture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-sm">User Authentication</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Users authenticate with their GP51 credentials, which are securely stored and validated against Supabase
                </p>
              </div>
              
              <div className="p-3 bg-green-50 rounded-lg">
                <h4 className="font-medium text-sm">Vehicle Data Access</h4>
                <p className="text-xs text-gray-600 mt-1">
                  RLS policies ensure users only see their assigned vehicles from the synchronized GP51 data
                </p>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-sm">Real-time Updates</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Live vehicle positions and status updates via Supabase realtime subscriptions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Key Features Implementation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                Authentication Features
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Core</Badge>
                  GP51 username/password authentication
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Security</Badge>
                  Biometric login support
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">UX</Badge>
                  Remember me functionality
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Security</Badge>
                  Secure session management
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Database className="h-4 w-4 text-green-600" />
                Vehicle Tracking Features
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Live</Badge>
                  Real-time vehicle positions
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">History</Badge>
                  Vehicle movement trails
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Alerts</Badge>
                  Speed and geofence notifications
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Offline</Badge>
                  Cached data access
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Implementation Roadmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-blue-100 text-blue-800">Phase 1</Badge>
                  <span className="font-medium text-sm">Setup & Auth</span>
                </div>
                <ul className="text-xs space-y-1 text-gray-600">
                  <li>• Flutter project initialization</li>
                  <li>• Supabase SDK integration</li>
                  <li>• Authentication screens</li>
                  <li>• Secure storage setup</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-green-100 text-green-800">Phase 2</Badge>
                  <span className="font-medium text-sm">Core Features</span>
                </div>
                <ul className="text-xs space-y-1 text-gray-600">
                  <li>• Vehicle list and details</li>
                  <li>• Real-time position tracking</li>
                  <li>• Map integration</li>
                  <li>• Basic notifications</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-purple-100 text-purple-800">Phase 3</Badge>
                  <span className="font-medium text-sm">Advanced</span>
                </div>
                <ul className="text-xs space-y-1 text-gray-600">
                  <li>• History and reports</li>
                  <li>• Advanced alerts</li>
                  <li>• Offline capabilities</li>
                  <li>• Performance optimization</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FlutterAppGuide;
