
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  Database,
  TrendingUp,
  Shield,
  Wrench
} from 'lucide-react';
import { gp51DataSyncManager } from '@/services/gp51/GP51DataSyncManager';
import { DataIntegrityReport, DataIntegrityIssue } from '@/types/dataIntegrity';

const DataIntegrityDashboard: React.FC = () => {
  const { data: report, isLoading, refetch, error } = useQuery({
    queryKey: ['data-integrity-report'],
    queryFn: () => gp51DataSyncManager.generateIntegrityReport(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={colors[severity as keyof typeof colors] || colors.low}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Data Integrity Dashboard</h2>
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load data integrity report. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  if (!report) {
    return (
      <Alert>
        <Database className="h-4 w-4" />
        <AlertDescription>
          No data integrity report available.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Data Integrity Dashboard</h2>
          <p className="text-gray-600">
            Monitor and maintain data quality across your system
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Status Overview Card */}
      <Card className={getStatusColor(report.status)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(report.status)}
              <div>
                <h3 className="text-lg font-semibold">
                  System Status: {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                </h3>
                <p className="text-sm text-gray-600">
                  Overall integrity score: {report.overallScore}%
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{report.overallScore}%</div>
              <Progress value={report.overallScore} className="w-24 mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.totalRecords.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              System-wide data records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valid Records</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{report.validRecords.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Clean, complete data
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues Found</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{report.issues.length}</div>
            <p className="text-xs text-muted-foreground">
              Requiring attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Fixable</CardTitle>
            <Wrench className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {report.issues.filter(issue => issue.autoFixable).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Can be resolved automatically
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Issues List */}
      {report.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Data Integrity Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.issues.map((issue: DataIntegrityIssue) => (
                <div key={issue.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{issue.description}</h4>
                      {getSeverityBadge(issue.severity)}
                      {issue.autoFixable && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          Auto-Fixable
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">Type: {issue.type}</p>
                    {issue.count && (
                      <p className="text-sm text-gray-600">Affected records: {issue.count}</p>
                    )}
                  </div>
                  {issue.autoFixable && (
                    <Button variant="outline" size="sm">
                      <Wrench className="h-4 w-4 mr-1" />
                      Fix
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Footer Info */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {new Date(report.timestamp).toLocaleString()}
      </div>
    </div>
  );
};

export default DataIntegrityDashboard;
