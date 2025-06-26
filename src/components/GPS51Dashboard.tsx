import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  AlertTriangle, 
  Car, 
  Users, 
  MapPin,
  Activity,
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GP51DataService } from '@/services/gp51/GP51DataService';

const gp51DataService = new GP51DataService();

interface GPS51DashboardState {
  isLoading: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  lastUpdate: Date | null;
  stats: {
    totalDevices: number;
    activeDevices: number;
    onlineDevices: number;
    offlineDevices: number;
    totalGroups: number;
  };
  error: string | null;
}

const GPS51Dashboard: React.FC = () => {
  const [state, setState] = React.useState<GPS51DashboardState>({
    isLoading: false,
    connectionStatus: 'disconnected',
    lastUpdate: null,
    stats: {
      totalDevices: 0,
      activeDevices: 0,
      onlineDevices: 0,
      offlineDevices: 0,
      totalGroups: 0
    },
    error: null
  });

  const { toast } = useToast();

  const fetchDashboardData = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('📊 Fetching GPS51 dashboard data...');

      // Test connection first
      const connectionTest = await gp51DataService.testConnection();
      
      if (!connectionTest.success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          connectionStatus: 'error',
          error: connectionTest.error || 'Connection test failed'
        }));
        return;
      }

      // Fetch live vehicles data
      const vehiclesResponse = await gp51DataService.getLiveVehicles();
      
      if (!vehiclesResponse.success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          connectionStatus: 'error',
          error: vehiclesResponse.error || 'Failed to fetch vehicles'
        }));
        return;
      }

      const vehicles = vehiclesResponse.vehicles || [];
      
      // Fetch groups data
      const groupsResponse = await gp51DataService.getGroups();
      const groups = groupsResponse.data || [];

      // Calculate stats
      const totalDevices = vehicles.length;
      const activeDevices = vehicles.filter(v => v.isActive).length;
      const onlineDevices = vehicles.filter(v => v.lastActiveTime && 
        new Date(v.lastActiveTime) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length;

      setState(prev => ({
        ...prev,
        isLoading: false,
        connectionStatus: 'connected',
        lastUpdate: new Date(),
        stats: {
          totalDevices,
          activeDevices,
          onlineDevices,
          offlineDevices: totalDevices - onlineDevices,
          totalGroups: groups.length
        },
        error: null
      }));

      toast({
        title: "Dashboard Updated",
        description: `Loaded ${totalDevices} devices from ${groups.length} groups`,
      });

    } catch (error) {
      console.error('❌ Dashboard fetch error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        connectionStatus: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }));

      toast({
        title: "Update Failed",
        description: "Failed to fetch dashboard data",
        variant: "destructive"
      });
    }
  };

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  const getConnectionIcon = () => {
    if (state.isLoading) return <RefreshCw className="h-5 w-5 animate-spin" />;
    if (state.connectionStatus === 'connected') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (state.connectionStatus === 'error') return <XCircle className="h-5 w-5 text-red-500" />;
    return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  };

  const getConnectionBadge = () => {
    if (state.isLoading) return <Badge variant="outline">Connecting...</Badge>;
    if (state.connectionStatus === 'connected') return <Badge variant="default" className="bg-green-500">Connected</Badge>;
    if (state.connectionStatus === 'error') return <Badge variant="destructive">Error</Badge>;
    return <Badge variant="secondary">Disconnected</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">GPS51 Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Real-time fleet monitoring and management
          </p>
        </div>
        <Button 
          onClick={fetchDashboardData}
          disabled={state.isLoading}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${state.isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getConnectionIcon()}
            GPS51 Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getConnectionBadge()}
              {state.lastUpdate && (
                <span className="text-sm text-gray-600">
                  Last updated: {state.lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          
          {state.error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Connection Error:</strong> {state.error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.stats.totalDevices.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Fleet size</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{state.stats.activeDevices.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {state.stats.totalDevices > 0 ? 
                Math.round((state.stats.activeDevices / state.stats.totalDevices) * 100) : 0}% of fleet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{state.stats.onlineDevices.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Connected devices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <WifiOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{state.stats.offlineDevices.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">No recent activity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{state.stats.totalGroups.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Device groups</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common GPS51 management tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <MapPin className="h-6 w-6" />
              <span>View Live Map</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Activity className="h-6 w-6" />
              <span>Device Status</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Clock className="h-6 w-6" />
              <span>Recent Activity</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      {state.connectionStatus === 'connected' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-green-600">
                  {state.stats.totalDevices > 0 ? 
                    Math.round((state.stats.onlineDevices / state.stats.totalDevices) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-600">Online Rate</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-2xl font-bold text-blue-600">
                  {state.stats.totalDevices > 0 ? 
                    Math.round((state.stats.activeDevices / state.stats.totalDevices) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-600">Active Rate</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-2xl font-bold text-purple-600">
                  {state.stats.totalGroups > 0 ? 
                    Math.round(state.stats.totalDevices / state.stats.totalGroups) : 0}
                </div>
                <div className="text-sm text-gray-600">Avg Devices/Group</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-2xl font-bold text-gray-600">
                  {state.lastUpdate ? 
                    Math.round((Date.now() - state.lastUpdate.getTime()) / 1000) : 0}s
                </div>
                <div className="text-sm text-gray-600">Last Update</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GPS51Dashboard;
