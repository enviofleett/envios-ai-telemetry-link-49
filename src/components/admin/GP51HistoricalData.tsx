
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Download, FileText, BarChart3, AlertCircle } from 'lucide-react';
import { gps51DataService } from '@/services/gp51/GPS51DataService';
import { useToast } from '@/hooks/use-toast';

const GP51HistoricalData: React.FC = () => {
  const [importHistory, setImportHistory] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalImports: 0,
    successfulImports: 0,
    failedImports: 0,
    totalRecords: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [historyResult, summaryResult] = await Promise.all([
        gps51DataService.getImportStatus(),
        gps51DataService.getDashboardSummary()
      ]);

      if (historyResult.success) {
        setImportHistory(historyResult.data);
        
        // Calculate analytics
        const totalImports = historyResult.data.length;
        const successfulImports = historyResult.data.filter(imp => imp.status === 'completed').length;
        const failedImports = historyResult.data.filter(imp => imp.status === 'failed').length;
        const totalRecords = historyResult.data.reduce((sum, imp) => sum + (imp.total_imported || 0), 0);
        
        setAnalytics({
          totalImports,
          successfulImports,
          failedImports,
          totalRecords
        });
      }

      if (!historyResult.success && !summaryResult.success) {
        throw new Error('Failed to load import data');
      }

    } catch (error) {
      console.error('❌ Failed to load historical data:', error);
      setError(error.message);
      toast({
        title: "Data Load Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = async (format: 'json' | 'csv') => {
    try {
      const data = {
        analytics,
        importHistory,
        exportedAt: new Date().toISOString()
      };

      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === 'json') {
        content = JSON.stringify(data, null, 2);
        filename = `gps51-historical-data-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      } else {
        // Convert to CSV
        const csvHeaders = ['Import ID', 'Type', 'Status', 'Started', 'Completed', 'Records Imported', 'Errors'];
        const csvRows = importHistory.map(imp => [
          imp.id,
          imp.import_type,
          imp.status,
          new Date(imp.started_at).toLocaleString(),
          imp.completed_at ? new Date(imp.completed_at).toLocaleString() : 'N/A',
          imp.total_imported || 0,
          imp.total_errors || 0
        ]);
        
        content = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
        filename = `gps51-historical-data-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Data exported as ${filename}`
      });

    } catch (error) {
      console.error('❌ Export failed:', error);
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'running':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Running</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading historical data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{analytics.totalImports}</div>
            <p className="text-sm text-muted-foreground">Total Imports</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{analytics.successfulImports}</div>
            <p className="text-sm text-muted-foreground">Successful</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{analytics.failedImports}</div>
            <p className="text-sm text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{analytics.totalRecords}</div>
            <p className="text-sm text-muted-foreground">Records Imported</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              GPS51 Historical Data & Analytics
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={loadData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => exportData('json')} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
              <Button onClick={() => exportData('csv')} variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="history" className="w-full">
            <TabsList>
              <TabsTrigger value="history">Import History</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="space-y-4">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {importHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No import history available. Run your first import to see data here.
                </div>
              ) : (
                <div className="space-y-4">
                  {importHistory.map((importRecord, index) => (
                    <Card key={importRecord.id || index}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">
                                {importRecord.import_type || 'Unknown'} Import
                              </h4>
                              {getStatusBadge(importRecord.status)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Started: {new Date(importRecord.started_at).toLocaleString()}
                              {importRecord.completed_at && (
                                <> • Completed: {new Date(importRecord.completed_at).toLocaleString()}</>
                              )}
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="text-sm">
                              <span className="text-green-600 font-medium">
                                {importRecord.total_imported || 0} imported
                              </span>
                              {importRecord.total_errors > 0 && (
                                <span className="text-red-600 font-medium ml-2">
                                  {importRecord.total_errors} errors
                                </span>
                              )}
                            </div>
                            {importRecord.error_message && (
                              <div className="text-xs text-red-600 max-w-xs truncate">
                                {importRecord.error_message}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {importRecord.import_results && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                              <div>
                                <span className="font-medium">Groups:</span> {importRecord.import_results.groups?.imported || 0}
                              </div>
                              <div>
                                <span className="font-medium">Devices:</span> {importRecord.import_results.devices?.imported || 0}
                              </div>
                              <div>
                                <span className="font-medium">Users:</span> {importRecord.import_results.users?.imported || 0}
                              </div>
                              <div>
                                <span className="font-medium">Positions:</span> {importRecord.import_results.positions?.imported || 0}
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Successful:</span>
                        <span className="text-green-600 font-medium">
                          {analytics.totalImports > 0 
                            ? Math.round((analytics.successfulImports / analytics.totalImports) * 100)
                            : 0
                          }%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Failed:</span>
                        <span className="text-red-600 font-medium">
                          {analytics.totalImports > 0 
                            ? Math.round((analytics.failedImports / analytics.totalImports) * 100)
                            : 0
                          }%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Import Volume</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Records:</span>
                        <span className="font-medium">{analytics.totalRecords.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg per Import:</span>
                        <span className="font-medium">
                          {analytics.totalImports > 0 
                            ? Math.round(analytics.totalRecords / analytics.totalImports).toLocaleString()
                            : 0
                          }
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default GP51HistoricalData;
