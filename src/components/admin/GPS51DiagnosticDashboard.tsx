
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertTriangle, CheckCircle, Database, Zap, Play } from 'lucide-react';
import { gps51DataService } from '@/services/gp51/GPS51DataService';
import { useToast } from '@/hooks/use-toast';

const GPS51DiagnosticDashboard: React.FC = () => {
  const [data, setData] = useState({
    summary: { total_devices: 0, active_devices: 0, expired_devices: 0, total_groups: 0 },
    groups: [],
    devices: [],
    loading: true,
    error: null
  });

  const [diagnosticInfo, setDiagnosticInfo] = useState(null);
  const [connectionMethod, setConnectionMethod] = useState('functions');
  const [connectionTests, setConnectionTests] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [connectionMethod]);

  const runDiagnostic = async () => {
    try {
      console.log('🔍 Running comprehensive diagnostic...');
      setDiagnosticInfo({ loading: true });
      
      const result = await gps51DataService.runDiagnostic();
      
      if (result.success) {
        setDiagnosticInfo(result.data);
        toast({
          title: "Diagnostic Complete",
          description: `Found ${result.data.summary.totalRecords} total records across ${result.data.summary.existingTables} tables`
        });
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('❌ Diagnostic failed:', error);
      setDiagnosticInfo({ error: error.message });
      toast({
        title: "Diagnostic Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const loadData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      let result;

      if (connectionMethod === 'functions') {
        console.log('📡 Using Edge Functions...');
        result = await gps51DataService.getDashboardSummary();
        
        if (result.success) {
          const [groupsResult, devicesResult] = await Promise.all([
            gps51DataService.getGroupList({ limit: 50 }),
            gps51DataService.getDeviceList({ limit: 100 })
          ]);
          
          result.data.groups = groupsResult.success ? groupsResult.data : [];
          result.data.devices = devicesResult.success ? devicesResult.data : [];
        }
      } else {
        console.log('🔗 Using direct database access...');
        result = await gps51DataService.getDataDirectly();
      }

      if (result.success) {
        setData(prev => ({
          ...prev,
          summary: result.data.summary || result.data,
          groups: result.data.groups || [],
          devices: result.data.devices || [],
          loading: false
        }));

        console.log('✅ Data loaded successfully:', {
          groups: result.data.groups?.length || 0,
          devices: result.data.devices?.length || 0,
          summary: result.data.summary || result.data
        });
      } else {
        throw new Error(result.error || 'API returned unsuccessful result');
      }

    } catch (error) {
      console.error('❌ Failed to load data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));

      toast({
        title: "Data Load Failed",
        description: error.message,
        variant: "destructive"
      });

      // Auto-run diagnostic on error
      runDiagnostic();
    }
  };

  const testConnections = async () => {
    try {
      console.log('🧪 Testing all connection methods...');
      setConnectionTests([{ name: 'Testing...', success: false, loading: true }]);
      
      const results = await gps51DataService.testConnections();
      setConnectionTests(results);
      
      const successCount = results.filter(r => r.success).length;
      toast({
        title: "Connection Tests Complete",
        description: `${successCount}/${results.length} tests passed`
      });

    } catch (error) {
      console.error('❌ Connection tests failed:', error);
      setConnectionTests([{
        name: 'Connection Test',
        success: false,
        error: error.message
      }]);
    }
  };

  const startImport = async () => {
    try {
      setIsImporting(true);
      console.log('🚀 Starting GPS51 import...');
      
      const result = await gps51DataService.startImport('full', { clearStuck: true });
      
      if (result.success) {
        toast({
          title: "Import Started Successfully",
          description: `Import ID: ${result.importId}. Check import status for progress.`
        });
        
        // Reload data after import
        setTimeout(() => {
          loadData();
        }, 2000);
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('❌ Import failed:', error);
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            GPS51 Diagnostic Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Method Selector */}
          <div className="flex gap-4">
            <Button
              onClick={() => setConnectionMethod('direct')}
              variant={connectionMethod === 'direct' ? 'default' : 'outline'}
              size="sm"
            >
              <Database className="h-4 w-4 mr-2" />
              Direct DB Access
            </Button>
            <Button
              onClick={() => setConnectionMethod('functions')}
              variant={connectionMethod === 'functions' ? 'default' : 'outline'}
              size="sm"
            >
              <Zap className="h-4 w-4 mr-2" />
              Edge Functions
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={loadData}
              disabled={data.loading}
              variant="default"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${data.loading ? 'animate-spin' : ''}`} />
              {data.loading ? 'Loading...' : 'Reload Data'}
            </Button>
            <Button
              onClick={runDiagnostic}
              variant="outline"
              size="sm"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Run Diagnostic
            </Button>
            <Button
              onClick={testConnections}
              variant="outline"
              size="sm"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Test Connections
            </Button>
            <Button
              onClick={startImport}
              disabled={isImporting}
              variant="secondary"
              size="sm"
            >
              <Play className={`h-4 w-4 mr-2 ${isImporting ? 'animate-spin' : ''}`} />
              {isImporting ? 'Importing...' : 'Start Import'}
            </Button>
          </div>

          {/* Error Display */}
          {data.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <strong>Error:</strong> {data.error}
              </div>
            </div>
          )}

          {/* Data Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">
                  {data.summary.total_devices}
                </div>
                <p className="text-sm text-muted-foreground">Total Devices</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">
                  {data.summary.active_devices}
                </div>
                <p className="text-sm text-muted-foreground">Active Devices</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-purple-600">
                  {data.summary.total_groups}
                </div>
                <p className="text-sm text-muted-foreground">Groups</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-orange-600">
                  {data.summary.expired_devices || 0}
                </div>
                <p className="text-sm text-muted-foreground">Expired</p>
              </CardContent>
            </Card>
          </div>

          {/* Connection Test Results */}
          {connectionTests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Connection Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {connectionTests.map((test, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{test.name}</span>
                      <div className="flex items-center gap-2">
                        {test.loading ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Badge variant={test.success ? "default" : "destructive"}>
                            {test.success ? 'Pass' : 'Fail'}
                          </Badge>
                        )}
                        {test.error && (
                          <span className="text-sm text-red-600">{test.error}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Diagnostic Information */}
          {diagnosticInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Diagnostic Information</CardTitle>
              </CardHeader>
              <CardContent>
                {diagnosticInfo.loading ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Running diagnostic...</span>
                  </div>
                ) : diagnosticInfo.error ? (
                  <div className="text-red-600">{diagnosticInfo.error}</div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <strong>Total Tables:</strong> {diagnosticInfo.summary?.totalTables || 0}
                      </div>
                      <div>
                        <strong>Existing Tables:</strong> {diagnosticInfo.summary?.existingTables || 0}
                      </div>
                      <div>
                        <strong>Total Records:</strong> {diagnosticInfo.summary?.totalRecords || 0}
                      </div>
                      <div>
                        <strong>Last Check:</strong> {new Date(diagnosticInfo.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    
                    {diagnosticInfo.tables && (
                      <div>
                        <h4 className="font-semibold mb-2">Table Status:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {diagnosticInfo.tables.map((table, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="font-mono text-sm">{table.table}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant={table.exists ? "default" : "destructive"}>
                                  {table.exists ? `${table.count} rows` : 'Missing'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Sample Data Preview */}
          {data.devices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sample Devices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Device ID</th>
                        <th className="text-left p-2">Device Name</th>
                        <th className="text-left p-2">Group</th>
                        <th className="text-left p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.devices.slice(0, 5).map((device, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2 font-mono text-xs">{device.device_id}</td>
                          <td className="p-2">{device.device_name}</td>
                          <td className="p-2">{device.gps51_groups?.group_name || 'N/A'}</td>
                          <td className="p-2">
                            <Badge variant={device.is_active ? "default" : "secondary"}>
                              {device.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GPS51DiagnosticDashboard;
