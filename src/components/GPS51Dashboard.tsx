
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Database, Users, Car, MapPin, Activity } from 'lucide-react';
import { gps51DataService } from '@/services/gp51/GPS51DataService';
import type { GPS51DataResponse, GPS51TestResult } from '@/types/gp51';
import DeviceTable from './DeviceTable';
import GroupGrid from './GroupGrid';
import DiagnosticPanel from './DiagnosticPanel';
import StatisticsCards from './StatisticsCards';

const GPS51Dashboard: React.FC = () => {
  const [data, setData] = useState<GPS51DataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Loading GPS51 dashboard data...');
      
      // Try direct database access first
      const result = await gps51DataService.getDataDirectly();
      setData(result);
      setLastRefresh(new Date());
      
      console.log('✅ Dashboard data loaded successfully:', result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
      console.error('❌ Dashboard data load error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  const handleImport = async () => {
    try {
      setLoading(true);
      console.log('🔄 Starting GPS51 import...');
      
      const result = await gps51DataService.startImport('full');
      console.log('✅ Import result:', result);
      
      // Refresh data after import
      setTimeout(() => {
        loadDashboardData();
      }, 2000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Import failed';
      console.error('❌ Import error:', errorMessage);
      setError(`Import failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading GPS51 dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">GPS51 Dashboard</h1>
          <p className="text-muted-foreground">
            Fleet management and device monitoring
            {lastRefresh && (
              <span className="ml-2 text-sm">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleImport}
            disabled={loading}
          >
            <Database className="h-4 w-4 mr-2" />
            Import Data
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      {data?.success && (
        <StatisticsCards summary={data.data?.summary} />
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Database Connection</p>
                    <Badge variant={data?.success ? "default" : "destructive"}>
                      {data?.success ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data Status</p>
                    <Badge variant={data?.data?.summary.total_devices ? "default" : "secondary"}>
                      {data?.data?.summary.total_devices ? "Data Available" : "No Data"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Manage your GPS51 data and connections
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button variant="outline" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
                <Button variant="outline" onClick={handleImport}>
                  <Database className="h-4 w-4 mr-2" />
                  Import from GPS51
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="devices">
          <DeviceTable 
            devices={data?.data?.devices || []} 
            loading={loading}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="groups">
          <GroupGrid 
            groups={data?.data?.groups || []} 
            loading={loading}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="diagnostics">
          <DiagnosticPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GPS51Dashboard;
