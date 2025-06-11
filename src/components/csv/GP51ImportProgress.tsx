
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users,
  Car,
  RotateCcw,
  Download
} from 'lucide-react';
import { GP51LiveImportJob } from '@/hooks/useGP51LiveImport';

interface GP51ImportProgressProps {
  importJob: GP51LiveImportJob | null;
  onReset: () => void;
}

const GP51ImportProgress: React.FC<GP51ImportProgressProps> = ({
  importJob,
  onReset
}) => {
  if (!importJob) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No import job in progress</p>
        <Button onClick={onReset} variant="outline" className="mt-4">
          Start New Import
        </Button>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (importJob.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'running':
        return <Clock className="h-5 w-5 text-blue-600 animate-pulse" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (importJob.status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'running':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const exportResults = () => {
    const results = {
      jobId: importJob.id,
      status: importJob.status,
      summary: {
        totalItems: importJob.totalItems || 0,
        processedItems: importJob.processedItems || 0,
        successfulItems: importJob.successfulItems || 0,
        failedItems: importJob.failedItems || 0
      },
      results: importJob.results || { users: { created: 0, updated: 0, failed: 0 }, devices: { created: 0, updated: 0, failed: 0 } },
      errors: importJob.errors || [],
      completedAt: importJob.completedAt || null
    };

    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gp51-import-results-${importJob.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {getStatusIcon()}
              Import Progress
            </span>
            <Badge variant="outline" className={getStatusColor()}>
              {importJob.status.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{importJob.progress || 0}%</span>
            </div>
            <Progress value={importJob.progress || 0} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{importJob.totalItems || 0}</div>
              <div className="text-sm text-muted-foreground">Total Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{importJob.processedItems || 0}</div>
              <div className="text-sm text-muted-foreground">Processed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{importJob.successfulItems || 0}</div>
              <div className="text-sm text-muted-foreground">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{importJob.failedItems || 0}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
          </div>

          {importJob.startedAt && (
            <div className="text-sm text-muted-foreground">
              Started: {new Date(importJob.startedAt).toLocaleString()}
              {importJob.completedAt && (
                <span> • Completed: {new Date(importJob.completedAt).toLocaleString()}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Results */}
      <Card>
        <CardHeader>
          <CardTitle>Import Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="font-medium">Users</span>
              </div>
              <div className="text-sm space-y-1">
                <div>Created: {importJob.results?.users?.created || 0}</div>
                <div>Updated: {importJob.results?.users?.updated || 0}</div>
                <div>Failed: {importJob.results?.users?.failed || 0}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                <span className="font-medium">Devices</span>
              </div>
              <div className="text-sm space-y-1">
                <div>Created: {importJob.results?.devices?.created || 0}</div>
                <div>Updated: {importJob.results?.devices?.updated || 0}</div>
                <div>Failed: {importJob.results?.devices?.failed || 0}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Errors */}
      {importJob.errors && importJob.errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Import Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {importJob.errors.map((error, index) => (
                <Alert key={index} variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {importJob.status === 'completed' && (importJob.failedItems || 0) === 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Import completed successfully! All {importJob.successfulItems || 0} items were imported without errors.
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={onReset} variant="outline">
          <RotateCcw className="h-4 w-4 mr-2" />
          Start New Import
        </Button>

        {(importJob.status === 'completed' || importJob.status === 'failed') && (
          <Button onClick={exportResults} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
        )}
      </div>
    </div>
  );
};

export default GP51ImportProgress;
