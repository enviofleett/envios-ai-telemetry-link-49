
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation, Shield, Zap, Activity } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
            Fleet Telemetry Hub
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Advanced GPS tracking and fleet management integration platform with enterprise-grade security
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* GPS51 Integration */}
          <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Navigation className="h-6 w-6 text-blue-400" />
                  GPS51 Integration
                </CardTitle>
                <Badge variant="default" className="bg-blue-600">New</Badge>
              </div>
              <CardDescription className="text-gray-400">
                Secure fleet tracking with advanced MD5 authentication and real-time monitoring
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Shield className="h-4 w-4 text-green-400" />
                  <span>Enterprise Security</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span>Real-time Testing</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Activity className="h-4 w-4 text-blue-400" />
                  <span>Live Monitoring</span>
                </div>
              </div>
              
              <Link to="/gps51">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Access GPS51 Hub
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Legacy GP51 Integration */}
          <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Navigation className="h-6 w-6 text-gray-400" />
                GP51 Legacy
              </CardTitle>
              <CardDescription className="text-gray-400">
                Original GP51 integration interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/gp51">
                <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-700">
                  Access Legacy Interface
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Features Card */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Security Features</CardTitle>
              <CardDescription className="text-gray-400">
                Built-in protection and monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">MD5 Validation:</span>
                  <span className="text-green-400">✓ Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Rate Limiting:</span>
                  <span className="text-green-400">✓ Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Input Validation:</span>
                  <span className="text-green-400">✓ Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Real-time Tests:</span>
                  <span className="text-green-400">✓ Active</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">32</div>
            <div className="text-sm text-gray-400">Character Hash</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">5</div>
            <div className="text-sm text-gray-400">Max Attempts</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400">15</div>
            <div className="text-sm text-gray-400">Minute Lockout</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">4</div>
            <div className="text-sm text-gray-400">Test Cases</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
