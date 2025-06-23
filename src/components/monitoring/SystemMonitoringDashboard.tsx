
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Clock, Smartphone, Database, Wifi } from 'lucide-react';
import { systemAlertManager } from '@/services/monitoring/SystemAlertManager';
import { supabase } from '@/integrations/supabase/client';

interface SystemStats {
  credentialHealth: {
    total: number;
    healthy: number;
    warning: number;
    critical: number;
  };
  dataConsistency: {
    score: number;
    lastCheck: string;
    discrepancies: number;
  };
  mobileAnalytics: {
    activeSessions: number;
    crashRate: number;
    totalCrashes: number;
  };
  alerts: {
    total: number;
    critical: number;
    warning: number;
    info: number;
  };
}

export const SystemMonitoringDashboard: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load system statistics
      const [credentialStats, consistencyStats, mobileStats, alertStats] = await Promise.all([
        loadCredentialStats(),
        loadConsistencyStats(),
        loadMobileStats(),
        systemAlertManager.getAlertsSummary()
      ]);

      setStats({
        credentialHealth: credentialStats,
        dataConsistency: consistencyStats,
        mobileAnalytics: mobileStats,
        alerts: alertStats
      });

      // Load active alerts
      const alerts = await systemAlertManager.getActiveAlerts();
      setActiveAlerts(alerts);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCredentialStats = async () => {
    const { data, error } = await supabase
      .from('credential_health_reports')
      .select('health_status')
      .gte('validation_timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    const stats = { total: 0, healthy: 0, warning: 0, critical: 0 };
    data?.forEach(report => {
      stats.total++;
      if (report.health_status === 'healthy') stats.healthy++;
      else if (report.health_status === 'warning') stats.warning++;
      else if (report.health_status === 'critical') stats.critical++;
    });

    return stats;
  };

  const loadConsistencyStats = async () => {
    const { data, error } = await supabase
      .from('data_consistency_monitoring')
      .select('consistency_score, completed_at, discrepancies_found')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return {
      score: data?.consistency_score || 0,
      lastCheck: data?.completed_at || '',
      discrepancies: data?.discrepancies_found || 0
    };
  };

  const loadMobileStats = async () => {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [sessionsResult, crashesResult] = await Promise.all([
      supabase
        .from('mobile_app_sessions')
        .select('id')
        .gte('session_start', dayAgo.toISOString())
        .is('session_end', null),
      supabase
        .from('mobile_app_crashes')
        .select('severity')
        .gte('crash_timestamp', dayAgo.toISOString())
    ]);

    const activeSessions = sessionsResult.data?.length || 0;
    const crashes = crashesResult.data || [];
    const totalCrashes = crashes.length;
    
    // Calculate crash rate (crashes per 100 sessions)
    const { data: totalSessions } = await supabase
      .from('mobile_app_sessions')
      .select('id')
      .gte('session_start', dayAgo.toISOString());

    const crashRate = totalSessions?.length ? (totalCrashes / totalSessions.length) * 100 : 0;

    return {
      activeSessions,
      crashRate: Math.round(crashRate * 100) / 100,
      totalCrashes
    };
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      // Get current user (you'll need to implement this based on your auth system)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await systemAlertManager.acknowledgeAlert(alertId, user.id);
        loadDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'default';
      case 'info': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string, value?: number) => {
    if (status === 'critical' || (value !== undefined && value < 70)) {
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    } else if (status === 'warning' || (value !== undefined && value < 90)) {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    } else {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">System Monitoring Dashboard</h1>
        <Button onClick={loadDashboardData} variant="outline">
          Refresh Data
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GP51 Credentials</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getStatusIcon('', stats?.credentialHealth.healthy || 0 / Math.max(stats?.credentialHealth.total || 1, 1) * 100)}
              <div className="text-2xl font-bold">
                {stats?.credentialHealth.healthy || 0}/{stats?.credentialHealth.total || 0}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.credentialHealth.critical || 0} critical, {stats?.credentialHealth.warning || 0} warnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Consistency</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getStatusIcon('', stats?.dataConsistency.score)}
              <div className="text-2xl font-bold">{stats?.dataConsistency.score || 0}%</div>
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.dataConsistency.discrepancies || 0} discrepancies found
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mobile Analytics</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getStatusIcon('', stats?.mobileAnalytics.crashRate ? 100 - stats.mobileAnalytics.crashRate : 100)}
              <div className="text-2xl font-bold">{stats?.mobileAnalytics.activeSessions || 0}</div>
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.mobileAnalytics.crashRate || 0}% crash rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.alerts.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.alerts.critical || 0} critical, {stats?.alerts.warning || 0} warnings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active System Alerts</CardTitle>
            <CardDescription>
              Recent alerts requiring attention ({activeAlerts.length} total)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeAlerts.slice(0, 5).map((alert) => (
                <Alert key={alert.id}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="flex items-center justify-between">
                    <span>{alert.title}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    </div>
                  </AlertTitle>
                  <AlertDescription>
                    <div className="mt-2">
                      <p>{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Source: {alert.sourceSystem} • {new Date(alert.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Tabs */}
      <Tabs defaultValue="credentials" className="space-y-4">
        <TabsList>
          <TabsTrigger value="credentials">GP51 Credentials</TabsTrigger>
          <TabsTrigger value="consistency">Data Consistency</TabsTrigger>
          <TabsTrigger value="mobile">Mobile Analytics</TabsTrigger>
          <TabsTrigger value="alerts">Alert Management</TabsTrigger>
        </TabsList>

        <TabsContent value="credentials">
          <Card>
            <CardHeader>
              <CardTitle>GP51 Credential Health</CardTitle>
              <CardDescription>
                Weekly validation results and session monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Detailed credential monitoring interface would be implemented here,
                showing session health, token expiration times, and validation history.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consistency">
          <Card>
            <CardHeader>
              <CardTitle>Data Consistency Monitoring</CardTitle>
              <CardDescription>
                Synchronization status between GP51 and local database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Detailed consistency monitoring interface would be implemented here,
                showing discrepancy details, resolution options, and sync history.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mobile">
          <Card>
            <CardHeader>
              <CardTitle>Mobile App Analytics</CardTitle>
              <CardDescription>
                Usage analytics, crash reports, and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Detailed mobile analytics interface would be implemented here,
                showing user sessions, crash details, and performance trends.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Alert Management</CardTitle>
              <CardDescription>
                Manage system alerts and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Detailed alert management interface would be implemented here,
                showing alert history, resolution tracking, and notification settings.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
