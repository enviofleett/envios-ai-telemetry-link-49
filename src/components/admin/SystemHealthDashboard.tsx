
import React from 'react';
import { useSystemHealth } from '@/hooks/useSystemHealth';
import { useGP51ValidationTesting } from '@/hooks/useGP51ValidationTesting';
import { SessionSecurityIndicator } from '@/components/security/SessionSecurityIndicator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Server, Database, CheckCircle, AlertTriangle, PlayCircle, Activity, Thermometer } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const HealthMetricCard = ({ title, value, status, icon, children }: { title: string; value: string; status?: 'healthy' | 'warning' | 'critical'; icon: React.ReactNode; children?: React.ReactNode }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={getStatusColor()}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {children}
      </CardContent>
    </Card>
  );
};


const SystemHealthDashboard: React.FC = () => {
    const { data: health, isLoading: isLoadingHealth, error: healthError } = useSystemHealth();
    const { runFullValidation, isRunning, results, clearResults } = useGP51ValidationTesting();

    if (isLoadingHealth) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Loading system health status...</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      );
    }
    
    if (healthError) {
      return (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">System Health Error</CardTitle>
            <CardDescription>Could not load system health status.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">{healthError.message}</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>System Health Overview</CardTitle>
            <CardDescription>Real-time monitoring of key system components. This data auto-refreshes.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
             <HealthMetricCard 
                title="Overall Health"
                value={health?.overallHealth.toUpperCase() ?? 'UNKNOWN'}
                status={health?.overallHealth}
                icon={<Activity className="h-4 w-4 text-muted-foreground" />}
             />
             <HealthMetricCard 
                title="GP51 Connection"
                value={health?.gp51Status.connected ? 'Connected' : 'Disconnected'}
                status={health?.gp51Status.connected ? 'healthy' : 'critical'}
                icon={<Server className="h-4 w-4 text-muted-foreground" />}
             >
                <p className="text-xs text-muted-foreground">{health?.gp51Status.username ? `as ${health.gp51Status.username}` : 'No active session'}</p>
             </HealthMetricCard>
             <HealthMetricCard 
                title="Database"
                value={health?.databaseStatus.connected ? 'Connected' : 'Error'}
                status={health?.databaseStatus.connected ? 'healthy' : 'critical'}
                icon={<Database className="h-4 w-4 text-muted-foreground" />}
             >
                <p className="text-xs text-muted-foreground">Response time: {health?.databaseStatus.responseTime}ms</p>
             </HealthMetricCard>
             <HealthMetricCard 
                title="API Endpoints"
                value={`${health?.apiEndpoints.available}/${health?.apiEndpoints.total} Available`}
                status={health?.apiEndpoints.available === health?.apiEndpoints.total ? 'healthy' : 'warning'}
                icon={<Thermometer className="h-4 w-4 text-muted-foreground" />}
             >
                {health?.apiEndpoints.issues && health.apiEndpoints.issues.length > 0 && <p className="text-xs text-destructive">{health.apiEndpoints.issues.join(', ')}</p>}
             </HealthMetricCard>
          </CardContent>
        </Card>
        
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>GP51 Integration Test Suite</CardTitle>
              <CardDescription>Run a comprehensive suite of tests to verify the GP51 integration.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => runFullValidation()} disabled={isRunning}>
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Run Full Validation
                  </>
                )}
              </Button>
              {results && (
                <div className="mt-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className='flex-grow'>
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-semibold">Overall Results</h4>
                        <p className="text-sm text-muted-foreground">
                          {results.overall.passedTests} / {results.overall.totalTests} passed ({results.overall.successRate.toFixed(1)}%)
                        </p>
                      </div>
                      <Progress value={results.overall.successRate} className="w-full" />
                    </div>
                     <Button variant="ghost" size="sm" onClick={clearResults} className="ml-4">Clear</Button>
                  </div>
                  {Object.entries(results.suites).map(([suiteName, suiteResult]) => (
                    <div key={suiteName}>
                      <h4 className="font-semibold capitalize">{suiteName.replace(/([A-Z])/g, ' $1')}</h4>
                      {suiteResult.tests.map(test => (
                        <div key={test.name} className="flex items-center gap-2 text-sm ml-2">
                          {test.success ? <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" /> : <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />}
                          <span className='font-medium'>{test.name}</span>
                          <span className="text-muted-foreground">({test.durationMs}ms)</span>
                          {!test.success && <span className="text-destructive text-xs">{test.error}</span>}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <SessionSecurityIndicator />
        </div>
      </div>
    );
};

export default SystemHealthDashboard;
