
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useGP51Diagnostics } from '@/hooks/useGP51Diagnostics';
import { Play, CheckCircle, XCircle, Clock, AlertTriangle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const GP51RawDiagnosticPanel: React.FC = () => {
  const { isRunning, results, lastRun, runDiagnostics } = useGP51Diagnostics();
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Content has been copied to your clipboard"
    });
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusIcon = (success: boolean, timedOut?: boolean) => {
    if (timedOut) return <Clock className="h-4 w-4 text-yellow-600" />;
    return success ? 
      <CheckCircle className="h-4 w-4 text-green-600" /> : 
      <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusBadge = (success: boolean, timedOut?: boolean) => {
    if (timedOut) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Timeout</Badge>;
    }
    return success ? 
      <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge> : 
      <Badge variant="destructive">Failed</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
              GP51 Raw Diagnostic Tests
            </CardTitle>
            <CardDescription>
              Comprehensive API endpoint testing with detailed request/response analysis
            </CardDescription>
          </div>
          <Button onClick={runDiagnostics} disabled={isRunning}>
            <Play className="mr-2 h-4 w-4" />
            {isRunning ? 'Running Tests...' : 'Run Diagnostics'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Section */}
        {results && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{results.summary.totalTests}</div>
              <div className="text-sm text-blue-700">Total Tests</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{results.summary.successfulTests}</div>
              <div className="text-sm text-green-700">Successful</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{results.summary.failedTests}</div>
              <div className="text-sm text-red-700">Failed</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{results.summary.timeoutTests}</div>
              <div className="text-sm text-yellow-700">Timeouts</div>
            </div>
          </div>
        )}

        {/* Session Info */}
        {results?.diagnosticInfo?.sessionInfo && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Session Info:</strong> User {results.diagnosticInfo.sessionInfo.username} | 
              Token: {results.diagnosticInfo.sessionInfo.tokenLength} chars | 
              Expires: {new Date(results.diagnosticInfo.sessionInfo.tokenExpiry).toLocaleString()} | 
              API: {results.diagnosticInfo.sessionInfo.apiUrl}
            </AlertDescription>
          </Alert>
        )}

        {/* Test Results */}
        {results?.testResults && results.testResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Results</h3>
            {results.testResults.map((test, index) => (
              <Card key={index} className="border-l-4" style={{
                borderLeftColor: test.timedOut ? '#f59e0b' : (test.success ? '#10b981' : '#ef4444')
              }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(test.success, test.timedOut)}
                      <CardTitle className="text-base">{test.testName}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(test.success, test.timedOut)}
                      <Badge variant="outline">{test.duration}ms</Badge>
                    </div>
                  </div>
                  <CardDescription className="font-mono text-xs break-all">
                    {test.method} {test.url}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Request Details */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Request Headers:</h4>
                    <div className="bg-gray-50 p-2 rounded text-xs font-mono">
                      <pre>{JSON.stringify(test.requestHeaders, null, 2)}</pre>
                    </div>
                  </div>

                  {test.requestBody && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Request Body:</h4>
                      <div className="bg-gray-50 p-2 rounded text-xs font-mono">
                        <pre>{test.requestBody}</pre>
                      </div>
                    </div>
                  )}

                  {/* Response Details */}
                  {test.httpStatus && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Response:</h4>
                      <div className="flex items-center space-x-2">
                        <Badge variant={test.httpStatus >= 200 && test.httpStatus < 300 ? "default" : "destructive"}>
                          {test.httpStatus} {test.httpStatusText}
                        </Badge>
                        {test.responseBodyLength && (
                          <Badge variant="outline">{test.responseBodyLength} bytes</Badge>
                        )}
                        {test.isJsonResponse !== undefined && (
                          <Badge variant={test.isJsonResponse ? "default" : "secondary"}>
                            {test.isJsonResponse ? "JSON" : "Text"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {test.responseHeaders && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Response Headers:</h4>
                      <div className="bg-gray-50 p-2 rounded text-xs font-mono">
                        <pre>{JSON.stringify(test.responseHeaders, null, 2)}</pre>
                      </div>
                    </div>
                  )}

                  {test.responseBodyRaw && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">Response Body:</h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(test.responseBodyRaw!)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <div className="bg-gray-50 p-2 rounded text-xs font-mono max-h-40 overflow-y-auto">
                        <pre>{test.responseBodyRaw}</pre>
                      </div>
                    </div>
                  )}

                  {test.responseBodyParsed && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Parsed Response:</h4>
                      <div className="bg-green-50 p-2 rounded text-xs font-mono">
                        <pre>{JSON.stringify(test.responseBodyParsed, null, 2)}</pre>
                      </div>
                    </div>
                  )}

                  {test.jsonParseError && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-red-600">JSON Parse Error:</h4>
                      <div className="bg-red-50 p-2 rounded text-xs font-mono text-red-700">
                        {test.jsonParseError}
                      </div>
                    </div>
                  )}

                  {test.error && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-red-600">Error:</h4>
                      <div className="bg-red-50 p-2 rounded text-xs font-mono text-red-700">
                        {test.error}
                        {test.errorType && <div className="mt-1">Type: {test.errorType}</div>}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Overall Results */}
        {results && (
          <Alert variant={results.summary.failedTests > 0 ? "destructive" : "default"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Overall Result:</strong> {results.success ? 'Success' : 'Failed'} - {results.message}
              <br />
              <strong>Summary:</strong> {results.summary.successfulTests}/{results.summary.totalTests} tests passed
              {results.summary.timeoutTests > 0 && `, ${results.summary.timeoutTests} timed out`}
            </AlertDescription>
          </Alert>
        )}

        {lastRun && (
          <div className="text-sm text-gray-500">
            Last run: {formatTimestamp(lastRun.toISOString())}
          </div>
        )}

        {!results && !isRunning && (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">No diagnostic tests have been run yet</div>
            <p className="text-sm text-gray-400">
              Click "Run Diagnostics" to test GP51 API endpoints with detailed analysis
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GP51RawDiagnosticPanel;
