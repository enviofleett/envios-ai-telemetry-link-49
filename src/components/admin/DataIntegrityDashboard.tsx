
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  TrendingUp,
  Database,
  Users,
  Car
} from 'lucide-react';
import { gp51DataSyncManager, DataIntegrityReport, DataIntegrityIssue } from '@/services/gp51/GP51DataSyncManager';

const DataIntegrityDashboard: React.FC = () => {
  const [report, setReport] = useState<DataIntegrityReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const generateReport = async () => {
    setIsLoading(true);
    try {
      const newReport = await gp51DataSyncManager.generateIntegrityReport();
      setReport(newReport);
      setLastChecked(new Date());
    } catch (error) {
      console.error('Failed to generate integrity report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, []);

  const getStatusColor = (status: DataIntegrityReport['status']) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: DataIntegrityReport['status']) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'good': return <TrendingUp className="h-5 w-5 text-blue-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <Shield className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: DataIntegrityIssue['severity']) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!report && !isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Data Integrity Dashboard
            </h3>
            <p className="text-gray-500 mb-4">
              Generate a report to assess your data quality
            </p>
            <Button onClick={generateReport}>
              Generate Integrity Report
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Integrity Dashboard</h2>
          <p className="text-gray-600">Monitor and maintain data quality across your system</p>
        </div>
        <Button 
          onClick={generateReport} 
          disabled={isLoading}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Generating...' : 'Refresh Report'}
        </Button>
      </div>

      {report && (
        <>
          {/* Overall Score Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(report.status)}
                Overall Data Integrity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-3xl font-bold text-gray-900">
                    {Math.round(report.score)}%
                  </div>
                  <Badge className={getStatusColor(report.status)}>
                    {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                  </Badge>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <div>Last checked: {lastChecked?.toLocaleString()}</div>
                  <div>Records analyzed: {report.totalRecords.toLocaleString()}</div>
                </div>
              </div>
              <Progress value={report.score} className="h-3" />
            </CardContent>
          </Card>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold">{report.corruptedRecords}</div>
                    <div className="text-sm text-gray-600">Corrupted Records</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="text-2xl font-bold">{report.missingRelations}</div>
                    <div className="text-sm text-gray-600">Missing Relations</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold">{report.duplicateRecords}</div>
                    <div className="text-sm text-gray-600">Duplicate Records</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <div className="text-2xl font-bold">{report.inconsistentData}</div>
                    <div className="text-sm text-gray-600">Inconsistent Data</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Issues List */}
          {report.issues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Detected Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.issues.map((issue) => (
                    <Alert key={issue.id}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{issue.description}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            Type: {issue.type.replace('_', ' ')} • 
                            {issue.autoFixable ? ' Auto-fixable' : ' Manual fix required'}
                          </div>
                        </div>
                        <Badge className={getSeverityColor(issue.severity)}>
                          {issue.severity}
                        </Badge>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  {report.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-gray-700">
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default DataIntegrityDashboard;
