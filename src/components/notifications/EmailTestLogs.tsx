
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEnhancedEmailTemplates } from '@/hooks/useEnhancedEmailTemplates';
import { 
  History, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Mail,
  TestTube,
  Users,
  RefreshCw
} from 'lucide-react';

export const EmailTestLogs: React.FC = () => {
  const { testLogs, templates, isLoadingLogs } = useEnhancedEmailTemplates();

  const getTemplateName = (templateId: string | null) => {
    if (!templateId) return 'Unknown Template';
    const template = templates?.find(t => t.id === templateId);
    return template?.template_name || 'Deleted Template';
  };

  const getStatusIcon = (successCount: number, failureCount: number) => {
    if (failureCount === 0) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (successCount === 0) return <XCircle className="h-4 w-4 text-red-500" />;
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusText = (successCount: number, failureCount: number) => {
    if (failureCount === 0) return 'All Sent';
    if (successCount === 0) return 'All Failed';
    return 'Partial';
  };

  const getStatusVariant = (successCount: number, failureCount: number) => {
    if (failureCount === 0) return 'default';
    if (successCount === 0) return 'destructive';
    return 'secondary';
  };

  if (isLoadingLogs) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading test logs...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Email Test History</h3>
          <p className="text-sm text-muted-foreground">
            Review past email test executions and their results
          </p>
        </div>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TestTube className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{testLogs?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Total Tests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {testLogs?.reduce((sum, log) => sum + log.success_count, 0) || 0}
                </p>
                <p className="text-xs text-muted-foreground">Emails Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-2xl font-bold">
                  {testLogs?.reduce((sum, log) => sum + log.failure_count, 0) || 0}
                </p>
                <p className="text-xs text-muted-foreground">Failed Sends</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {testLogs?.reduce((sum, log) => sum + log.recipient_emails.length, 0) || 0}
                </p>
                <p className="text-xs text-muted-foreground">Recipients</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Test Executions
          </CardTitle>
          <CardDescription>
            Detailed log of email test executions and their outcomes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {testLogs && testLogs.length > 0 ? (
            <div className="space-y-4">
              {testLogs.map(log => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(log.success_count, log.failure_count)}
                      <div>
                        <h4 className="font-medium">{getTemplateName(log.template_id)}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusVariant(log.success_count, log.failure_count)}>
                        {getStatusText(log.success_count, log.failure_count)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {log.test_type}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-muted-foreground">Recipients</p>
                      <p>{log.recipient_emails.length} email(s)</p>
                      <div className="mt-1">
                        {log.recipient_emails.slice(0, 2).map((email, i) => (
                          <span key={i} className="text-xs text-muted-foreground block">
                            {email}
                          </span>
                        ))}
                        {log.recipient_emails.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{log.recipient_emails.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="font-medium text-muted-foreground">Results</p>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          {log.success_count}
                        </span>
                        <span className="flex items-center gap-1 text-red-600">
                          <XCircle className="h-3 w-3" />
                          {log.failure_count}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="font-medium text-muted-foreground">Test Data</p>
                      <p className="text-xs">
                        {Object.keys(log.test_data).length} variables used
                      </p>
                      {Object.keys(log.test_data).length > 0 && (
                        <div className="mt-1">
                          {Object.keys(log.test_data).slice(0, 3).map(key => (
                            <span key={key} className="text-xs text-muted-foreground block">
                              {key}: {String(log.test_data[key]).substring(0, 20)}...
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {log.test_results && log.test_results.results && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="font-medium text-muted-foreground text-sm mb-2">Detailed Results</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {log.test_results.results.slice(0, 4).map((result: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            {result.status === 'fulfilled' ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-500" />
                            )}
                            <span className="truncate">{result.email}</span>
                            {result.error && (
                              <span className="text-red-500 text-xs">({result.error})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Test History</h3>
              <p className="text-muted-foreground">
                Test executions will appear here once you start sending test emails
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
