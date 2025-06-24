
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RefreshCw, 
  Play, 
  Pause, 
  Square, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Database,
  Users,
  Car,
  AlertCircle
} from 'lucide-react';
import { gp51DataSyncManager, SyncOperation, SyncConflict } from '@/services/gp51/GP51DataSyncManager';

const DataSyncManager: React.FC = () => {
  const [syncOperations, setSyncOperations] = useState<SyncOperation[]>([]);
  const [activeSyncId, setActiveSyncId] = useState<string | null>(null);
  const [isStartingSyncOperation, setIsStartingSyncOperation] = useState(false);

  useEffect(() => {
    // Load existing operations
    setSyncOperations(gp51DataSyncManager.getAllSyncOperations());

    // Subscribe to sync updates
    const unsubscribe = gp51DataSyncManager.subscribe((operation) => {
      setSyncOperations(prev => {
        const index = prev.findIndex(op => op.id === operation.id);
        if (index >= 0) {
          const newOperations = [...prev];
          newOperations[index] = operation;
          return newOperations;
        } else {
          return [...prev, operation];
        }
      });
    });

    return unsubscribe;
  }, []);

  const handleStartFullSync = async () => {
    try {
      setIsStartingSyncOperation(true);
      const operationId = await gp51DataSyncManager.startFullSync();
      setActiveSyncId(operationId);
    } catch (error) {
      console.error('Failed to start sync:', error);
    } finally {
      setIsStartingSyncOperation(false);
    }
  };

  const handlePauseSync = async (operationId: string) => {
    await gp51DataSyncManager.pauseSync(operationId);
  };

  const handleResumeSync = async (operationId: string) => {
    await gp51DataSyncManager.resumeSync(operationId);
  };

  const handleCancelSync = async (operationId: string) => {
    await gp51DataSyncManager.cancelSync(operationId);
    if (activeSyncId === operationId) {
      setActiveSyncId(null);
    }
  };

  const getStatusColor = (status: SyncOperation['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: SyncOperation['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'running': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'failed': return <AlertTriangle className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const activeOperation = activeSyncId ? syncOperations.find(op => op.id === activeSyncId) : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Synchronization Manager
            </CardTitle>
            <Button 
              onClick={handleStartFullSync}
              disabled={isStartingSyncOperation || !!activeOperation}
            >
              {isStartingSyncOperation ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Start Full Sync
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeOperation && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(activeOperation.status)}>
                    {getStatusIcon(activeOperation.status)}
                    <span className="ml-1 capitalize">{activeOperation.status}</span>
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {activeOperation.processedItems}/{activeOperation.totalItems} items
                  </span>
                </div>
                <div className="flex gap-2">
                  {activeOperation.status === 'running' && (
                    <Button size="sm" variant="outline" onClick={() => handlePauseSync(activeOperation.id)}>
                      <Pause className="h-4 w-4" />
                    </Button>
                  )}
                  {activeOperation.status === 'paused' && (
                    <Button size="sm" variant="outline" onClick={() => handleResumeSync(activeOperation.id)}>
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleCancelSync(activeOperation.id)}>
                    <Square className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Progress value={activeOperation.progress} className="mb-2" />
              <div className="text-sm text-gray-600">
                Progress: {activeOperation.progress}% • 
                Processed: {activeOperation.processedItems} • 
                Failed: {activeOperation.failedItems} • 
                Conflicts: {activeOperation.conflicts.length}
              </div>
            </div>
          )}

          <Tabs defaultValue="operations">
            <TabsList>
              <TabsTrigger value="operations">Sync Operations</TabsTrigger>
              <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
              <TabsTrigger value="integrity">Data Integrity</TabsTrigger>
            </TabsList>

            <TabsContent value="operations" className="space-y-4">
              {syncOperations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No sync operations yet. Start a full sync to begin.
                </div>
              ) : (
                <div className="space-y-3">
                  {syncOperations.map((operation) => (
                    <Card key={operation.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(operation.status)}>
                                {getStatusIcon(operation.status)}
                                <span className="ml-1 capitalize">{operation.status}</span>
                              </Badge>
                              <span className="font-medium">{operation.type.replace('_', ' ')}</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              Started: {operation.startedAt.toLocaleString()}
                              {operation.completedAt && (
                                <> • Completed: {operation.completedAt.toLocaleString()}</>
                              )}
                            </div>
                            {operation.errorMessage && (
                              <div className="text-sm text-red-600 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {operation.errorMessage}
                              </div>
                            )}
                          </div>
                          <div className="text-right text-sm">
                            <div>{operation.processedItems}/{operation.totalItems} items</div>
                            <div className="text-gray-500">{operation.progress}% complete</div>
                          </div>
                        </div>
                        {operation.progress > 0 && operation.progress < 100 && (
                          <Progress value={operation.progress} className="mt-3" />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="conflicts" className="space-y-4">
              <ConflictsList operations={syncOperations} />
            </TabsContent>

            <TabsContent value="integrity" className="space-y-4">
              <DataIntegrityPanel />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

const ConflictsList: React.FC<{ operations: SyncOperation[] }> = ({ operations }) => {
  const allConflicts = operations.flatMap(op => op.conflicts);

  const handleResolveConflict = async (conflictId: string, resolution: 'prefer_local' | 'prefer_remote') => {
    await gp51DataSyncManager.resolveConflict(conflictId, resolution);
  };

  const getSeverityColor = (severity: SyncConflict['severity']) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
    }
  };

  if (allConflicts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
        No conflicts detected. All data is synchronized properly.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {allConflicts.map((conflict) => (
        <Card key={conflict.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={getSeverityColor(conflict.severity)}>
                    {conflict.severity}
                  </Badge>
                  <span className="font-medium">{conflict.entityType} conflict</span>
                  <span className="text-sm text-gray-500">({conflict.conflictType})</span>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Local: {JSON.stringify(conflict.localData)}</div>
                  <div className="font-medium">Remote: {JSON.stringify(conflict.remoteData)}</div>
                </div>
                <div className="text-xs text-gray-500">
                  Detected: {conflict.detectedAt.toLocaleString()}
                </div>
              </div>
              {!conflict.autoResolvable && (
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleResolveConflict(conflict.id, 'prefer_local')}
                  >
                    Keep Local
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleResolveConflict(conflict.id, 'prefer_remote')}
                  >
                    Keep Remote
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const DataIntegrityPanel: React.FC = () => {
  const [integrityReport, setIntegrityReport] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const report = await gp51DataSyncManager.generateIntegrityReport();
      setIntegrityReport(report);
    } catch (error) {
      console.error('Failed to generate integrity report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Data Integrity Status</h3>
        <Button onClick={generateReport} disabled={isGenerating}>
          {isGenerating ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Database className="h-4 w-4 mr-2" />
          )}
          Generate Report
        </Button>
      </div>

      {integrityReport ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{integrityReport.score}</div>
              <div className="text-sm text-gray-600">Integrity Score</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{integrityReport.totalRecords}</div>
              <div className="text-sm text-gray-600">Total Records</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{integrityReport.issues.length}</div>
              <div className="text-sm text-gray-600">Issues Found</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{integrityReport.duplicateRecords}</div>
              <div className="text-sm text-gray-600">Duplicates</div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Generate a report to view data integrity status
        </div>
      )}
    </div>
  );
};

export default DataSyncManager;
