
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Play, RefreshCw, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { gps51DataService } from '@/services/gp51/GPS51DataService';
import type { GPS51TestResult } from '@/types/gp51';

const DiagnosticPanel: React.FC = () => {
  const [testResults, setTestResults] = useState<GPS51TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const runDiagnostics = async () => {
    setTesting(true);
    try {
      console.log('🔍 Running GPS51 diagnostics...');
      const results = await gps51DataService.testConnections();
      setTestResults(results);
      console.log('✅ Diagnostics completed:', results);
    } catch (error) {
      console.error('❌ Diagnostics failed:', error);
      setTestResults([
        {
          name: 'Diagnostic Test',
          success: false,
          data: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      ]);
    } finally {
      setTesting(false);
    }
  };

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Pass
      </Badge>
    ) : (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        Fail
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                System Diagnostics
              </CardTitle>
              <CardDescription>
                Test GPS51 data connections and system health
              </CardDescription>
            </div>
            <Button onClick={runDiagnostics} disabled={testing}>
              <Play className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
              Run Tests
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {testResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Click "Run Tests" to start system diagnostics
            </div>
          ) : (
            <div className="space-y-4">
              {/* Overall Status */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {testResults.every(r => r.success) ? (
                    <span className="text-green-600">All tests passed! System is healthy.</span>
                  ) : (
                    <span className="text-red-600">Some tests failed. Check details below.</span>
                  )}
                </AlertDescription>
              </Alert>

              {/* Test Results Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Count</TableHead>
                      <TableHead>Error Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testResults.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {result.name}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(result.success)}
                        </TableCell>
                        <TableCell>
                          {result.data}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {result.error && (
                            <span className="text-sm text-red-600 break-words">
                              {result.error}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Database Check */}
      <Card>
        <CardHeader>
          <CardTitle>Database Health Check</CardTitle>
          <CardDescription>
            Quick overview of database table status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { name: 'GPS51 Groups', table: 'gps51_groups' },
              { name: 'GPS51 Devices', table: 'gps51_devices' },
              { name: 'GPS51 Users', table: 'gps51_users' },
              { name: 'GPS51 Positions', table: 'gps51_positions' }
            ].map((item, index) => (
              <Card key={index} className="p-4">
                <div className="text-sm font-medium">{item.name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Table: {item.table}
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiagnosticPanel;
