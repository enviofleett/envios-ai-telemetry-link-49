
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Smartphone, 
  Code, 
  Database, 
  Shield, 
  MapPin, 
  Bell, 
  Download,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

const FlutterAppGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5 text-blue-600" />
            <CardTitle>Flutter Mobile App Development Guide</CardTitle>
          </div>
          <CardDescription>
            Complete roadmap for developing a GPS51 vehicle tracking mobile app with Flutter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center p-4 bg-blue-50 rounded-lg">
              <Code className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <div className="font-semibold text-blue-800">Flutter Framework</div>
                <div className="text-sm text-blue-600">Cross-platform development</div>
              </div>
            </div>
            <div className="flex items-center p-4 bg-green-50 rounded-lg">
              <Database className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <div className="font-semibold text-green-800">Supabase Integration</div>
                <div className="text-sm text-green-600">Real-time data sync</div>
              </div>
            </div>
            <div className="flex items-center p-4 bg-purple-50 rounded-lg">
              <MapPin className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <div className="font-semibold text-purple-800">Live Tracking</div>
                <div className="text-sm text-purple-600">Real-time vehicle positions</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Architecture</CardTitle>
              <CardDescription>High-level overview of the Flutter app architecture</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  The app will use Supabase Authentication and Row Level Security (RLS) to ensure users only see their own vehicle data.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Database className="h-4 w-4 mr-2" />
                    Data Layer
                  </h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Supabase client for database operations</li>
                    <li>• Real-time subscriptions for live updates</li>
                    <li>• Offline caching with Hive/SQLite</li>
                    <li>• Automatic sync when online</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Security
                  </h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• JWT token-based authentication</li>
                    <li>• Row Level Security policies</li>
                    <li>• Secure credential storage</li>
                    <li>• Biometric authentication option</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Implementation Roadmap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Badge className="bg-green-100 text-green-800">Phase 1</Badge>
                  <span className="font-medium">Authentication & Basic Setup</span>
                  <Badge variant="outline">2-3 weeks</Badge>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className="bg-blue-100 text-blue-800">Phase 2</Badge>
                  <span className="font-medium">Vehicle Data & Maps Integration</span>
                  <Badge variant="outline">3-4 weeks</Badge>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className="bg-purple-100 text-purple-800">Phase 3</Badge>
                  <span className="font-medium">Real-time Features & Notifications</span>
                  <Badge variant="outline">2-3 weeks</Badge>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className="bg-orange-100 text-orange-800">Phase 4</Badge>
                  <span className="font-medium">Testing & Deployment</span>
                  <Badge variant="outline">1-2 weeks</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Development Environment Setup</CardTitle>
              <CardDescription>Step-by-step setup instructions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold">1. Install Flutter SDK</h4>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <code className="text-sm">flutter doctor -v</code>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ensure Flutter is properly installed and all dependencies are met.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">2. Create Flutter Project</h4>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <code className="text-sm">flutter create gps51_mobile_app</code>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">3. Add Required Dependencies</h4>
                <div className="bg-gray-100 p-3 rounded-lg text-sm">
                  <pre>{`dependencies:
  flutter:
    sdk: flutter
  supabase_flutter: ^2.5.6
  google_maps_flutter: ^2.6.1
  geolocator: ^10.1.0
  flutter_secure_storage: ^9.0.0
  provider: ^6.1.1
  cached_network_image: ^3.3.1
  connectivity_plus: ^5.0.2
  local_auth: ^2.1.7
  firebase_messaging: ^14.7.10
  hive: ^2.2.3
  hive_flutter: ^1.1.0`}</pre>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Supabase Configuration:</strong> You'll need to configure your Supabase project URL and anon key in the Flutter app.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supabase Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-100 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">lib/main.dart</h4>
                <pre className="text-sm overflow-x-auto">{`import 'package:supabase_flutter/supabase_flutter.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await Supabase.initialize(
    url: 'https://bjkqxmvjuewshomihjqm.supabase.co',
    anonKey: 'your_anon_key_here',
  );
  
  runApp(MyApp());
}`}</pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Core Features Implementation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold">Authentication Flow</h4>
                  </div>
                  <ul className="text-sm space-y-1 text-muted-foreground pl-7">
                    <li>• Login screen with email/password</li>
                    <li>• Biometric authentication setup</li>
                    <li>• Secure token storage</li>
                    <li>• Auto-login on app startup</li>
                    <li>• Logout functionality</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold">Vehicle Tracking</h4>
                  </div>
                  <ul className="text-sm space-y-1 text-muted-foreground pl-7">
                    <li>• Vehicle list with status indicators</li>
                    <li>• Interactive map with vehicle markers</li>
                    <li>• Real-time position updates</li>
                    <li>• Vehicle details and history</li>
                    <li>• Geofence alerts</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-5 w-5 text-orange-600" />
                    <h4 className="font-semibold">Push Notifications</h4>
                  </div>
                  <ul className="text-sm space-y-1 text-muted-foreground pl-7">
                    <li>• Firebase Cloud Messaging setup</li>
                    <li>• Real-time vehicle alerts</li>
                    <li>• Geofence entry/exit notifications</li>
                    <li>• Maintenance reminders</li>
                    <li>• Custom notification preferences</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Database className="h-5 w-5 text-purple-600" />
                    <h4 className="font-semibold">Offline Support</h4>
                  </div>
                  <ul className="text-sm space-y-1 text-muted-foreground pl-7">
                    <li>• Local data caching with Hive</li>
                    <li>• Offline map tiles</li>
                    <li>• Sync when connection restored</li>
                    <li>• Connection status indicator</li>
                    <li>• Cached vehicle data viewing</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Technical Implementation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-100 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Real-time Data Subscription Example</h4>
                <pre className="text-sm overflow-x-auto">{`// lib/services/vehicle_service.dart
class VehicleService {
  static Stream<List<Vehicle>> getUserVehicles(String userId) {
    return Supabase.instance.client
        .from('vehicles')
        .stream(primaryKey: ['id'])
        .eq('user_id', userId)
        .map((data) => data.map((json) => Vehicle.fromJson(json)).toList());
  }
  
  static Stream<List<VehiclePosition>> getVehiclePositions(String vehicleId) {
    return Supabase.instance.client
        .from('vehicle_positions')
        .stream(primaryKey: ['id'])
        .eq('vehicle_id', vehicleId)
        .order('created_at', ascending: false)
        .limit(1)
        .map((data) => data.map((json) => VehiclePosition.fromJson(json)).toList());
  }
}`}</pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Build & Deployment Process</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center">
                    <Download className="h-4 w-4 mr-2" />
                    Android Deployment
                  </h4>
                  <div className="space-y-2">
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <code className="text-sm">flutter build apk --release</code>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <code className="text-sm">flutter build appbundle --release</code>
                    </div>
                  </div>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Configure app signing</li>
                    <li>• Set up Google Play Console</li>
                    <li>• Configure Firebase for Android</li>
                    <li>• Add required permissions in manifest</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center">
                    <Download className="h-4 w-4 mr-2" />
                    iOS Deployment
                  </h4>
                  <div className="space-y-2">
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <code className="text-sm">flutter build ios --release</code>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <code className="text-sm">flutter build ipa</code>
                    </div>
                  </div>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Configure Xcode project settings</li>
                    <li>• Set up Apple Developer account</li>
                    <li>• Configure Firebase for iOS</li>
                    <li>• Add required Info.plist permissions</li>
                  </ul>
                </div>
              </div>

              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  <strong>Estimated Timeline:</strong> Complete development and deployment typically takes 8-12 weeks for a full-featured GPS tracking app.
                </AlertDescription>
              </Alert>

              <div className="flex gap-4">
                <Button className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View Flutter Documentation
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Supabase Flutter Guide
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FlutterAppGuide;
