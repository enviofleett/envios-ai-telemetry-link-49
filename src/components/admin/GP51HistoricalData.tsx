
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Upload, 
  RefreshCw, 
  Database, 
  Activity, 
  Users, 
  Car, 
  MapPin,
  Calendar,
  Filter,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImportProgress {
  batchId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRecords: number;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  errors: string[];
  startedAt: string;
  completedAt?: string;
}

interface Analytics {
  summary: {
    totalDevices: number;
    activeDevices: number;
    totalGroups: number;
    totalUsers: number;
    recentPositions: number;
  };
  historical: any[];
  recentImports: any[];
}

const GP51HistoricalData: React.FC = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gps51-data', {
        body: {
          action: 'analytics',
          filters: {
            dateRange: {
              start: `${dateRange.start}T00:00:00Z`,
              end: `${dateRange.end}T23:59:59Z`
            }
          }
        }
      });

      if (error) throw error;

      if (data?.success) {
        setAnalytics(data.data);
      } else {
        throw new Error(data?.error || 'Failed to load analytics');
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const startImport = async (importType: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gps51-import', {
        body: {
          action: importType,
          options: {
            skipExisting: false,
            validateData: true,
            syncPositions: importType === 'full_import'
          }
        }
      });

      if (error) throw error;

      if (data?.success) {
        setImportProgress({
          batchId: data.batchId,
          status: 'processing',
          totalRecords: data.data.totalRecords || 0,
          processedRecords: 0,
          successfulRecords: data.data.successfulRecords || 0,
          failedRecords: data.data.failedRecords || 0,
          errors: data.data.errors || [],
          startedAt: new Date().toISOString()
        });
        toast.success(`${importType} started successfully`);
        
        // Refresh analytics after import
        setTimeout(() => {
          loadAnalytics();
          setImportProgress(null);
        }, 2000);
      } else {
        throw new Error(data?.error || `Failed to start ${importType}`);
      }
    } catch (error) {
      console.error(`Failed to start ${importType}:`, error);
      toast.error(`Failed to start ${importType}`);
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gps51-data', {
        body: {
          action: 'export',
          filters: {
            dateRange: {
              start: `${dateRange.start}T00:00:00Z`,
              end: `${dateRange.end}T23:59:59Z`
            }
          },
          exportFormat
        }
      });

      if (error) throw error;

      if (data?.success) {
        // Create and download file
        const blob = new Blob([JSON.stringify(data.data, null, 2)], {
          type: exportFormat === 'csv' ? 'text/csv' : 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gps51-export-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast.success('Data exported successfully');
      } else {
        throw new Error(data?.error || 'Failed to export data');
      }
    } catch (error) {
      console.error('Failed to export data:', error);
      toast.error('Failed to export data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">GPS51 Historical Data</h2>
          <p className="text-gray-600">Manage and analyze GPS51 historical data and imports</p>
        </div>
        <Button onClick={loadAnalytics} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Analytics Summary Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Devices</p>
                  <p className="text-2xl font-bold">{analytics.summary.totalDevices}</p>
                </div>
                <Car className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Devices</p>
                  <p className="text-2xl font-bold text-green-600">{analytics.summary.activeDevices}</p>
                </div>
                <Activity className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Groups</p>
                  <p className="text-2xl font-bold">{analytics.summary.totalGroups}</p>
                </div>
                <Database className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold">{analytics.summary.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Recent Positions</p>
                  <p className="text-2xl font-bold">{analytics.summary.recentPositions}</p>
                </div>
                <MapPin className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="import" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="import">Data Import</TabsTrigger>
          <TabsTrigger value="export">Data Export</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="history">Import History</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Import GPS51 Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {importProgress && (
                <Alert>
                  <Activity className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Import Status: {importProgress.status}</span>
                        <Badge variant={importProgress.status === 'completed' ? 'default' : 'secondary'}>
                          {importProgress.status}
                        </Badge>
                      </div>
                      <Progress 
                        value={(importProgress.successfulRecords / importProgress.totalRecords) * 100} 
                        className="w-full"
                      />
                      <p className="text-sm">
                        {importProgress.successfulRecords}/{importProgress.totalRecords} records processed
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Button 
                  onClick={() => startImport('full_import')}
                  disabled={isLoading}
                  className="h-20 flex-col"
                >
                  <Database className="h-6 w-6 mb-2" />
                  Full Import
                </Button>
                
                <Button 
                  onClick={() => startImport('devices')}
                  disabled={isLoading}
                  variant="outline"
                  className="h-20 flex-col"
                >
                  <Car className="h-6 w-6 mb-2" />
                  Devices Only
                </Button>
                
                <Button 
                  onClick={() => startImport('groups')}
                  disabled={isLoading}
                  variant="outline"
                  className="h-20 flex-col"
                >
                  <Database className="h-6 w-6 mb-2" />
                  Groups Only
                </Button>
                
                <Button 
                  onClick={() => startImport('users')}
                  disabled={isLoading}
                  variant="outline"
                  className="h-20 flex-col"
                >
                  <Users className="h-6 w-6 mb-2" />
                  Users Only
                </Button>
                
                <Button 
                  onClick={() => startImport('sync_positions')}
                  disabled={isLoading}
                  variant="outline"
                  className="h-20 flex-col"
                >
                  <MapPin className="h-6 w-6 mb-2" />
                  Sync Positions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="h-5 w-5 mr-2" />
                Export GPS51 Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Export Format</Label>
                  <Select value={exportFormat} onValueChange={(value: 'json' | 'csv') => setExportFormat(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button onClick={exportData} disabled={isLoading} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analytics?.historical && analytics.historical.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Historical Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.historical.map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-4">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{day.metric_date}</span>
                      </div>
                      <div className="flex space-x-6 text-sm">
                        <span>Devices: {day.device_count}</span>
                        <span>Active: {day.active_devices}</span>
                        <span>Positions: {day.position_updates}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {analytics?.recentImports && analytics.recentImports.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Import History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.recentImports.map((importLog: any) => (
                    <div key={importLog.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Badge variant={importLog.status === 'completed' ? 'default' : 
                                        importLog.status === 'failed' ? 'destructive' : 'secondary'}>
                            {importLog.status}
                          </Badge>
                          <span className="font-medium">{importLog.import_type}</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {new Date(importLog.started_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          {importLog.successful_records}/{importLog.total_records} successful
                        </p>
                        {importLog.failed_records > 0 && (
                          <p className="text-sm text-red-600">
                            {importLog.failed_records} failed
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GP51HistoricalData;
