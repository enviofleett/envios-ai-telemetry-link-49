
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDataIntegrity } from '@/hooks/useDataIntegrity';
import { Database, Shield, Activity, AlertTriangle, CheckCircle, Clock, Settings, RotateCcw } from 'lucide-react';

export const DataIntegrityDashboard: React.FC = () => {
  const {
    metrics,
    isLoading,
    lastUpdated,
    hasIntegrityIssues,
    integrityScore,
    recentBackups,
    dataHealth,
    activeReconciliationJobs,
    completedReconciliationJobs,
    runConsistencyCheck,
    startAutoReconciliation,
    startManualReconciliation,
    createBackup,
    rollbackToBackup,
    refreshData
  } = useDataIntegrity();

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthBadgeVariant = (health: string) => {
    switch (health) {
      case 'excellent':
      case 'good':
        return 'secondary';
      case 'fair':
        return 'default';
      case 'poor':
      case 'critical':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Data Integrity Dashboard</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Data Integrity Dashboard</h2>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshData} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={runConsistencyCheck} size="sm">
            <Shield className="h-4 w-4 mr-2" />
            Run Check
          </Button>
        </div>
      </div>

      {/* Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Health</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{dataHealth}</div>
            <Badge variant={getHealthBadgeVariant(dataHealth)} className="mt-2">
              Score: {integrityScore}%
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Integrity Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hasIntegrityIssues ? 'Issues Found' : 'Clean'}
            </div>
            <Badge variant={hasIntegrityIssues ? 'destructive' : 'secondary'} className="mt-2">
              {hasIntegrityIssues ? 'Needs Attention' : 'All Good'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Backups</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentBackups.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeReconciliationJobs.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Running reconciliation
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="consistency" className="space-y-6">
        <TabsList>
          <TabsTrigger value="consistency">Consistency Checks</TabsTrigger>
          <TabsTrigger value="reconciliation">Data Reconciliation</TabsTrigger>
          <TabsTrigger value="backups">Backup & Recovery</TabsTrigger>
        </TabsList>

        <TabsContent value="consistency" className="space-y-6">
          {/* Consistency Report */}
          {metrics?.consistencyReport && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Latest Consistency Report
                </CardTitle>
                <CardDescription>
                  Report generated on {metrics.consistencyReport.timestamp.toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {metrics.consistencyReport.checksPassed}
                    </div>
                    <p className="text-sm text-muted-foreground">Passed</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {metrics.consistencyReport.checksFailed}
                    </div>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {metrics.consistencyReport.checksPerformed}
                    </div>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Score</span>
                    <span>{metrics.consistencyReport.overallScore}%</span>
                  </div>
                  <Progress value={metrics.consistencyReport.overallScore} />
                </div>

                {metrics.consistencyReport.failedChecks.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Failed Checks</h4>
                    <div className="space-y-2">
                      {metrics.consistencyReport.failedChecks.map((check, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <span className="font-medium">{check.check.name}</span>
                            <p className="text-sm text-muted-foreground">{check.message}</p>
                          </div>
                          <Badge variant="destructive">{check.check.severity}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {metrics.consistencyReport.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Recommendations</h4>
                    <ul className="space-y-1">
                      {metrics.consistencyReport.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reconciliation" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Data Reconciliation</h3>
            <div className="flex gap-2">
              <Button 
                onClick={startAutoReconciliation} 
                variant="outline" 
                size="sm"
                disabled={activeReconciliationJobs.length > 0}
              >
                <Settings className="h-4 w-4 mr-2" />
                Auto Reconcile
              </Button>
              <Button 
                onClick={() => startManualReconciliation(['merge_duplicate_users'])} 
                size="sm"
                disabled={activeReconciliationJobs.length > 0}
              >
                Manual Reconcile
              </Button>
            </div>
          </div>

          {/* Active Jobs */}
          {activeReconciliationJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Active Reconciliation Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeReconciliationJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <span className="font-medium">{job.name}</span>
                        <p className="text-sm text-muted-foreground">
                          Started: {job.startedAt?.toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">{job.status}</Badge>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completed Jobs */}
          {completedReconciliationJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Reconciliation Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {completedReconciliationJobs.slice(0, 5).map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <span className="font-medium">{job.name}</span>
                        <p className="text-sm text-muted-foreground">
                          Processed: {job.itemsProcessed}, Resolved: {job.itemsResolved}
                        </p>
                      </div>
                      <Badge variant={job.status === 'completed' ? 'secondary' : 'destructive'}>
                        {job.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="backups" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Backup & Recovery</h3>
            <div className="flex gap-2">
              <Button 
                onClick={() => createBackup({ 
                  name: `Manual_Backup_${new Date().toISOString().split('T')[0]}`,
                  description: 'Manual backup created from dashboard'
                })} 
                variant="outline" 
                size="sm"
              >
                <Database className="h-4 w-4 mr-2" />
                Create Backup
              </Button>
            </div>
          </div>

          {/* Recent Backups */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Backups</CardTitle>
              <CardDescription>
                Backups created in the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentBackups.length > 0 ? (
                <div className="space-y-3">
                  {recentBackups.map((backup) => (
                    <div key={backup.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <span className="font-medium">{backup.name}</span>
                        <p className="text-sm text-muted-foreground">
                          Created: {backup.createdAt.toLocaleString()}
                        </p>
                        <div className="flex gap-2 mt-1">
                          {backup.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {(backup.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rollbackToBackup(backup.id, { 
                            createRollbackPoint: true,
                            validateBeforeRollback: true 
                          })}
                        >
                          Restore
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No recent backups found. Create your first backup to get started.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
