
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
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);
  const [connectionTest, setConnectionTest] = useState<any>(null);
  const [dataMode, setDataMode] = useState<'api' | 'mock'>('api');

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, [dataMode]);

  const loadDashboardData = async () => {
    if (dataMode === 'mock') {
      // Mock data for testing
      setData({
        success: true,
        data: {
          groups: [
            {
              id: '1',
              group_id: 1,
              group_name: 'Fleet A',
              remark: 'Primary fleet vehicles',
              device_count: 25,
              is_active: true,
              shared: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              last_sync_at: new Date().toISOString()
            },
            {
              id: '2',
              group_id: 2,
              group_name: 'Fleet B',
              remark: 'Secondary fleet',
              device_count: 18,
              is_active: true,
              shared: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              last_sync_at: new Date().toISOString()
            }
          ],
          devices: [
            {
              id: '1',
              device_id: 'DEV001',
              device_name: 'Vehicle Alpha',
              group_id: 1,
              device_type: 92,
              device_tag: 'ALPHA',
              car_tag_color: 1,
              sim_number: '1234567890',
              login_name: 'alpha_login',
              creator: 'admin',
              status_code: 1,
              status_text: 'Normal',
              last_active_time: Date.now(),
              overdue_time: null,
              expire_notify_time: Date.now() + 86400000,
              allow_edit: 1,
              starred: false,
              icon: 1,
              remark: 'Test vehicle',
              video_channel_count: 4,
              is_active: true,
              days_since_active: 0,
              create_time: Date.now(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              last_sync_at: new Date().toISOString(),
              gps51_groups: { group_name: 'Fleet A' }
            }
          ],
          users: [
            {
              id: '1',
              envio_user_id: 'env001',
              gp51_username: 'admin',
              nickname: 'Administrator',
              company_name: 'Test Company',
              email: 'admin@example.com',
              phone: '1234567890',
              qq: '123456',
              wechat: 'admin_wechat',
              multi_login: 1,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              last_sync_at: new Date().toISOString()
            }
          ],
          summary: {
            total_devices: 1,
            active_devices: 1,
            total_groups: 2,
            devices_with_positions: 0
          }
        }
      });
      setLoading(false);
      setError(null);
      return;
    }

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

  const runDiagnostic = async () => {
    try {
      const result = await gps51DataService.testConnections();
      setDiagnosticInfo(result);
    } catch (error) {
      console.error('❌ Diagnostic failed:', error);
      setDiagnosticInfo([{
        name: 'Diagnostic Error',
        success: false,
        data: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }]);
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
            variant={dataMode === 'api' ? 'default' : 'outline'}
            onClick={() => setDataMode('api')}
            size="sm"
          >
            Live Data
          </Button>
          <Button
            variant={dataMode === 'mock' ? 'default' : 'outline'}
            onClick={() => setDataMode('mock')}
            size="sm"
          >
            Mock Data
          </Button>
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

      {/* Data Mode Indicator */}
      {dataMode === 'mock' && (
        <Alert>
          <AlertDescription>
            <strong>Mock Data Mode:</strong> Displaying sample data for testing. Switch to "Live Data" to see real GPS51 data.
          </AlertDescription>
        </Alert>
      )}

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
                <Button variant="outline" onClick={runDiagnostic}>
                  <Activity className="h-4 w-4 mr-2" />
                  Run Diagnostic
                </Button>
              </CardContent>
            </Card>

            {/* Diagnostic Results */}
            {diagnosticInfo && (
              <Card>
                <CardHeader>
                  <CardTitle>Diagnostic Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {diagnosticInfo.map((test: GPS51TestResult, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="font-medium">{test.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={test.success ? "default" : "destructive"}>
                            {test.success ? "✅ Pass" : "❌ Fail"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {test.data} records
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
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
