
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Database, 
  Smartphone, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  RefreshCw,
  TrendingUp,
  Users,
  Zap,
  Shield,
  Server
} from 'lucide-react';

// Demo data interfaces
interface SystemAlert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  created_at: string;
  status: string;
}

interface HealthReport {
  id: string;
  username: string;
  health_status: 'healthy' | 'warning' | 'critical';
  connectivity_test_passed: boolean;
  api_response_time_ms: number;
  created_at: string;
}

interface MobileSession {
  id: string;
  user_id: string;
  platform: string;
  app_version: string;
  duration_minutes: number;
  crash_count: number;
  created_at: string;
}

interface DataConsistencyCheck {
  id: string;
  check_type: string;
  status: 'pending' | 'completed' | 'failed';
  consistency_score: number;
  discrepancies_found: number;
  created_at: string;
}

export const SystemMonitoringDashboard: React.FC = () => {
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [healthReports, setHealthReports] = useState<HealthReport[]>([]);
  const [mobileSessions, setMobileSessions] = useState<MobileSession[]>([]);
  const [consistencyChecks, setConsistencyChecks] = useState<DataConsistencyCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Demo data generation
  useEffect(() => {
    const generateDemoData = () => {
      // Generate demo system alerts
      const alerts: SystemAlert[] = [
        {
          id: '1',
          alert_type: 'gp51_connection_failure',
          severity: 'high',
          title: 'GP51 Connection Failed',
          message: 'Failed to establish connection to GP51 API',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          status: 'active'
        },
        {
          id: '2',
          alert_type: 'database_slow_query',
          severity: 'medium',
          title: 'Slow Database Query Detected',
          message: 'Query execution time exceeded 5 seconds',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          status: 'resolved'
        },
        {
          id: '3',
          alert_type: 'mobile_app_crash',
          severity: 'critical',
          title: 'Mobile App Crash Spike',
          message: 'Increased crash rate detected in iOS app v2.1.0',
          created_at: new Date(Date.now() - 1800000).toISOString(),
          status: 'active'
        }
      ];

      // Generate demo health reports
      const reports: HealthReport[] = [
        {
          id: '1',
          username: 'gp51_service',
          health_status: 'healthy',
          connectivity_test_passed: true,
          api_response_time_ms: 150,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          username: 'backup_service',
          health_status: 'warning',
          connectivity_test_passed: true,
          api_response_time_ms: 450,
          created_at: new Date(Date.now() - 1800000).toISOString()
        },
        {
          id: '3',
          username: 'sync_service',
          health_status: 'critical',
          connectivity_test_passed: false,
          api_response_time_ms: 0,
          created_at: new Date(Date.now() - 3600000).toISOString()
        }
      ];

      // Generate demo mobile sessions
      const sessions: MobileSession[] = [
        {
          id: '1',
          user_id: 'user1',
          platform: 'iOS',
          app_version: '2.1.0',
          duration_minutes: 25,
          crash_count: 0,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          user_id: 'user2',
          platform: 'Android',
          app_version: '2.0.9',
          duration_minutes: 45,
          crash_count: 1,
          created_at: new Date(Date.now() - 1800000).toISOString()
        },
        {
          id: '3',
          user_id: 'user3',
          platform: 'iOS',
          app_version: '2.1.0',
          duration_minutes: 12,
          crash_count: 2,
          created_at: new Date(Date.now() - 3600000).toISOString()
        }
      ];

      // Generate demo consistency checks
      const checks: DataConsistencyCheck[] = [
        {
          id: '1',
          check_type: 'vehicle_data_sync',
          status: 'completed',
          consistency_score: 98,
          discrepancies_found: 3,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          check_type: 'user_permissions',
          status: 'completed',
          consistency_score: 100,
          discrepancies_found: 0,
          created_at: new Date(Date.now() - 1800000).toISOString()
        },
        {
          id: '3',
          check_type: 'gp51_mapping',
          status: 'failed',
          consistency_score: 85,
          discrepancies_found: 12,
          created_at: new Date(Date.now() - 3600000).toISOString()
        }
      ];

      setSystemAlerts(alerts);
      setHealthReports(reports);
      setMobileSessions(sessions);
      setConsistencyChecks(checks);
      setIsLoading(false);
      setLastRefresh(new Date());
    };

    generateDemoData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(generateDemoData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const refreshData = () => {
    setIsLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      setLastRefresh(new Date());
      setIsLoading(false);
    }, 1000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500 text-white';
      case 'warning': return 'bg-yellow-500 text-white';
      case 'critical': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getResponseTimeStatus = (time: number) => {
    if (time < 200) return { color: 'text-green-600', label: 'Good' };
    if (time < 500) return { color: 'text-yellow-600', label: 'Slow' };
    return { color: 'text-red-600', label: 'Poor' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading monitoring data...</span>
      </div>
    );
  }

  const activeAlerts = systemAlerts.filter(alert => alert.status === 'active');
  const healthyServices = healthReports.filter(report => report.health_status === 'healthy').length;
  const totalCrashes = mobileSessions.reduce((sum, session) => sum + session.crash_count, 0);
  const avgConsistencyScore = consistencyChecks.length > 0 
    ? Math.round(consistencyChecks.reduce((sum, check) => sum + check.consistency_score, 0) / consistencyChecks.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">System Monitoring Dashboard</h1>
        <Button onClick={refreshData} disabled={isLoading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{activeAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeAlerts.filter(a => a.severity === 'critical').length} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy Services</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{healthyServices}/{healthReports.length}</div>
            <p className="text-xs text-muted-foreground">
              Service health status
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mobile Crashes</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{totalCrashes}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Consistency</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{avgConsistencyScore}%</div>
            <p className="text-xs text-muted-foreground">
              Average score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Monitoring Tabs */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">System Alerts</TabsTrigger>
          <TabsTrigger value="health">Credential Health</TabsTrigger>
          <TabsTrigger value="mobile">Mobile App Monitoring</TabsTrigger>
          <TabsTrigger value="consistency">Data Consistency</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                System Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <span className="font-medium">{alert.title}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={alert.status === 'active' ? 'destructive' : 'secondary'}>
                      {alert.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Credential Health Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {healthReports.map((report) => {
                  const responseTimeStatus = getResponseTimeStatus(report.api_response_time_ms);
                  return (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{report.username}</span>
                          <Badge className={getHealthStatusColor(report.health_status)}>
                            {report.health_status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className={report.connectivity_test_passed ? 'text-green-600' : 'text-red-600'}>
                            {report.connectivity_test_passed ? '✓ Connected' : '✗ Disconnected'}
                          </span>
                          <span className={responseTimeStatus.color}>
                            {responseTimeStatus.label} ({report.api_response_time_ms}ms)
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(report.created_at).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <Alert className="mt-4">
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Response Time Legend: 
                  <span className="text-green-600 font-semibold">Good (&lt; 200ms)</span> | 
                  <span className="text-yellow-600 font-semibold">Slow (200-500ms)</span> | 
                  <span className="text-red-600 font-semibold">Poor (&gt; 500ms)</span>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mobile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Mobile App Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mobileSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{session.platform}</span>
                        <Badge variant="outline">{session.app_version}</Badge>
                        {session.crash_count > 0 && (
                          <Badge variant="destructive">{session.crash_count} crashes</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        Duration: {session.duration_minutes} minutes
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(session.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consistency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Consistency Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {consistencyChecks.map((check) => (
                  <div key={check.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{check.check_type.replace('_', ' ').toUpperCase()}</span>
                        <Badge variant={check.status === 'completed' ? 'default' : check.status === 'failed' ? 'destructive' : 'secondary'}>
                          {check.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className={check.consistency_score >= 95 ? 'text-green-600' : check.consistency_score >= 85 ? 'text-yellow-600' : 'text-red-600'}>
                          Score: {check.consistency_score}%
                        </span>
                        {check.discrepancies_found > 0 && (
                          <span className="text-orange-600">
                            {check.discrepancies_found} discrepancies
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(check.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="text-sm text-gray-500 text-center">
        Last updated: {lastRefresh.toLocaleString()}
      </div>
    </div>
  );
};
