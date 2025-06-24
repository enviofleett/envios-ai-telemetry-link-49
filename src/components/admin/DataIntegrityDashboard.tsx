
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Database,
  TrendingUp,
  AlertCircle,
  Target
} from 'lucide-react';
import { DataIntegrityReport, DataIntegrityIssue } from '@/services/gp51/GP51DataSyncManager';
import { useDataSync } from '@/hooks/useDataSync';

const DataIntegrityDashboard: React.FC = () => {
  const [integrityReport, setIntegrityReport] = useState<DataIntegrityReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { generateIntegrityReport } = useDataSync();

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const report = await generateIntegrityReport();
      setIntegrityReport(report);
    } catch (error) {
      console.error('Failed to generate integrity report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreStatus = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
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
      case 'critical': return <AlertCircle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'low': return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Data Integrity Dashboard</h2>
        </div>
        <Button onClick={handleGenerateReport} disabled={isGenerating}>
          {isGenerating ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Target className="h-4 w-4 mr-2" />
          )}
          Generate Report
        </Button>
      </div>

      {integrityReport ? (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className={`text-3xl font-bold ${getScoreColor(integrityReport.score)}`}>
                      {integrityReport.score}
                    </div>
                    <div className="text-sm text-gray-600">
                      Integrity Score • {getScoreStatus(integrityReport.score)}
                    </div>
                  </div>
                </div>
                <Progress 
                  value={integrityReport.score} 
                  className="mt-4" 
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Database className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{integrityReport.totalRecords.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Total Records</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-red-600">{integrityReport.issues.length}</div>
                    <div className="text-sm text-gray-600">Issues Found</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-yellow-600">
                      {integrityReport.issues.filter(i => i.autoFixable).length}
                    </div>
                    <div className="text-sm text-gray-600">Auto-fixable</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Data Quality Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Corrupted Records</span>
                  <Badge variant="destructive">{integrityReport.corruptedRecords}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Missing Relations</span>
                  <Badge variant="destructive">{integrityReport.missingRelations}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Duplicate Records</span>
                  <Badge variant="secondary">{integrityReport.duplicateRecords}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Inconsistent Data</span>
                  <Badge variant="secondary">{integrityReport.inconsistentData}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Issue Severity Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {['critical', 'high', 'medium', 'low'].map(severity => {
                  const count = integrityReport.issues.filter(i => i.severity === severity).length;
                  return (
                    <div key={severity} className="flex justify-between items-center">
                      <span className="text-sm capitalize">{severity}</span>
                      <Badge className={getSeverityColor(severity as DataIntegrityIssue['severity'])}>
                        {count}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Report Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm">
                  <div className="font-medium mb-2">Generated:</div>
                  <div className="text-gray-600">{integrityReport.timestamp.toLocaleString()}</div>
                </div>
                <div className="text-sm">
                  <div className="font-medium mb-2">Next Recommended Check:</div>
                  <div className="text-gray-600">
                    {new Date(integrityReport.timestamp.getTime() + 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Issues List */}
          {integrityReport.issues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Data Integrity Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {integrityReport.issues.map((issue) => (
                    <div key={issue.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge className={getSeverityColor(issue.severity)}>
                              {getSeverityIcon(issue.severity)}
                              <span className="ml-1 capitalize">{issue.severity}</span>
                            </Badge>
                            <span className="font-medium">{issue.type.replace('_', ' ')}</span>
                            <span className="text-sm text-gray-500">in {issue.table}</span>
                          </div>
                          <div className="text-sm text-gray-700">{issue.description}</div>
                          <div className="text-sm">
                            <span className="font-medium">Recommended Action:</span> {issue.recommendedAction}
                          </div>
                        </div>
                        {issue.autoFixable && (
                          <Button size="sm" variant="outline">
                            Auto Fix
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No Integrity Report Available</h3>
            <p className="text-gray-600 mb-6">
              Generate a data integrity report to analyze the health and consistency of your data.
            </p>
            <Button onClick={handleGenerateReport} disabled={isGenerating}>
              {isGenerating ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Target className="h-4 w-4 mr-2" />
              )}
              Generate First Report
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DataIntegrityDashboard;
