
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Database, Settings, TrendingUp } from 'lucide-react';
import { gps51DataService, type DiagnosticInfo } from '@/services/gp51/GPS51DataService';
import DiagnosticPanel from '../DiagnosticPanel';

const GPS51DiagnosticDashboard: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<{
    status: 'healthy' | 'warning' | 'error';
    message: string;
  }>({ status: 'healthy', message: 'System running normally' });
  
  const [diagnosticInfo, setDiagnosticInfo] = useState<DiagnosticInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const checkSystemHealth = async () => {
    setLoading(true);
    try {
      const result = await gps51DataService.testConnection();
      const diagnostic = await gps51DataService.runDiagnostic();
      
      setDiagnosticInfo(diagnostic);
      
      if (result.success && diagnostic.tablesFound.length >= 3) {
        setSystemHealth({
          status: 'healthy',
          message: 'All systems operational'
        });
      } else if (result.success) {
        setSystemHealth({
          status: 'warning',
          message: 'Some tables may be missing data'
        });
      } else {
        setSystemHealth({
          status: 'error',
          message: result.message
        });
      }
    } catch (error) {
      setSystemHealth({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSystemHealth();
  }, []);

  const getHealthBadge = () => {
    const { status } = systemHealth;
    const variants = {
      healthy: 'default' as const,
      warning: 'secondary' as const,
      error: 'destructive' as const
    };
    
    const colors = {
      healthy: 'text-green-600',
      warning: 'text-yellow-600',
      error: 'text-red-600'
    };

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Status</p>
                <div className="flex items-center gap-2 mt-2">
                  {getHealthBadge()}
                </div>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tables Found</p>
                <p className="text-2xl font-bold mt-2">
                  {diagnosticInfo?.tablesFound.length || 0}
                </p>
              </div>
              <Database className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Errors</p>
                <p className="text-2xl font-bold mt-2">
                  {diagnosticInfo?.errors.length || 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Check</p>
                <p className="text-sm mt-2">
                  {diagnosticInfo?.timestamp ? 
                    new Date(diagnosticInfo.timestamp).toLocaleTimeString() : 
                    'Never'
                  }
                </p>
              </div>
              <Settings className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health Message */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">System Health</h3>
              <p className="text-muted-foreground mt-1">{systemHealth.message}</p>
            </div>
            <Button onClick={checkSystemHealth} disabled={loading}>
              {loading ? 'Checking...' : 'Refresh Health'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Diagnostic Tabs */}
      <Tabs defaultValue="diagnostic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="diagnostic">Diagnostic Panel</TabsTrigger>
          <TabsTrigger value="monitoring">System Monitoring</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="diagnostic">
          <DiagnosticPanel />
        </TabsContent>

        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle>System Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">Database Connectivity</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {diagnosticInfo?.connectivity.success ? 
                        'Connected and responsive' : 
                        'Connection issues detected'
                      }
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">Data Freshness</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Last updated: {diagnosticInfo?.timestamp ? 
                        new Date(diagnosticInfo.timestamp).toLocaleString() : 
                        'Unknown'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Diagnostic Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Auto-refresh Diagnostics</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically run diagnostics every 5 minutes
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Alert Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Send notifications when errors are detected
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GPS51DiagnosticDashboard;
