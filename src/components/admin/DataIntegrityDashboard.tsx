
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Info
} from 'lucide-react';
import { gp51DataSyncManager, DataIntegrityReport, DataIntegrityIssue } from '@/services/gp51/GP51DataSyncManager';

const DataIntegrityDashboard: React.FC = () => {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const { data: report, refetch, isLoading } = useQuery({
    queryKey: ['data-integrity-report'],
    queryFn: () => gp51DataSyncManager.generateIntegrityReport(),
    enabled: false, // Only run when explicitly requested
  });

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      await refetch();
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreStatus = (score: number) => {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  };

  const getSeverityColor = (severity: DataIntegrityIssue['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
    }
  };

  const getSeverityIcon = (severity: DataIntegrityIssue['severity']) => {
    switch (severity) {
      case 'critical':
      case 'high': return <XCircle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'low': return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Integrity Dashboard</h2>
          <p className="text-gray-600">Monitor and analyze data quality across your system</p>
        </div>
        <Button 
          onClick={handleGenerateReport}
          disabled={isGeneratingReport || isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${(isGeneratingReport || isLoading) ? 'animate-spin' : ''}`} />
          {isGeneratingReport || isLoading ? 'Generating...' : 'Generate Report'}
        </Button>
      </div>

      {report && (
        <>
          {/* Overall Score Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Integrity Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className={`text-4xl font-bold ${getScoreColor(report.score)}`}>
                    {report.score}%
                  </div>
                  <p className="text-gray-600 capitalize">
                    {getScoreStatus(report.score)} data quality
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Total Records</div>
                  <div className="text-2xl font-semibold">{report.totalRecords.toLocaleString()}</div>
                </div>
              </div>
              <Progress value={report.score} className="w-full" />
            </CardContent>
          </Card>

          {/* Issues Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Issues</p>
                    <p className="text-2xl font-bold">{report.issues.length}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Critical Issues</p>
                    <p className="text-2xl font-bold text-red-600">
                      {report.issues.filter(i => i.severity === 'critical').length}
                    </p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Corrupted Records</p>
                    <p className="text-2xl font-bold text-red-600">{report.corruptedRecords}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Missing Relations</p>
                    <p className="text-2xl font-bold text-orange-600">{report.missingRelations}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Issues */}
          {report.issues.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Identified Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.issues.map((issue) => (
                    <Alert key={issue.id}>
                      <div className="flex items-start gap-3">
                        {getSeverityIcon(issue.severity)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium">{issue.description}</h4>
                            <Badge className={getSeverityColor(issue.severity)}>
                              {issue.severity}
                            </Badge>
                          </div>
                          {issue.details && (
                            <p className="text-sm text-gray-600">
                              Details: {JSON.stringify(issue.details)}
                            </p>
                          )}
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="flex items-center gap-2 p-6">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800">No Issues Found</h3>
                  <p className="text-green-700">Your data integrity is excellent!</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Report Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Report Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                Generated on: {new Date(report.timestamp).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!report && !isLoading && (
        <Card>
          <CardContent className="text-center py-8">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Available</h3>
            <p className="text-gray-600 mb-4">Generate a data integrity report to see detailed analysis</p>
            <Button onClick={handleGenerateReport}>
              Generate Your First Report
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DataIntegrityDashboard;
