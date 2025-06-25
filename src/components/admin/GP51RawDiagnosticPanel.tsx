
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useGP51Diagnostics, type DiagnosticTestResult } from '@/hooks/useGP51Diagnostics';
import { Search, ChevronDown, ChevronUp, Copy, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

const GP51RawDiagnosticPanel: React.FC = () => {
  const { isRunning, results, lastRun, runDiagnostics } = useGP51Diagnostics();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusIcon = (result: DiagnosticTestResult) => {
    if (result.timedOut) return <Clock className="h-4 w-4 text-yellow-600" />;
    if (result.success) return <CheckCircle className="h-4 w-4 text-green-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusColor = (result: DiagnosticTestResult) => {
    if (result.timedOut) return 'bg-yellow-100 text-yellow-800';
    if (result.success) return 'bg-green-100 text-green-800';
    return 'bg-red-100 text-red-800';
  };

  const formatHeaders = (headers: Record<string, string>) => {
    return Object.entries(headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-blue-600" />
            <CardTitle>GP51 Raw HTTP Diagnostic Tool</CardTitle>
          </div>
          <Button onClick={runDiagnostics} disabled={isRunning} size="sm">
            {isRunning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Running Tests...
              </>
            ) : (
              'Run Comprehensive Diagnostics'
            )}
          </Button>
        </div>
        <CardDescription>
          Execute multiple GP51 API test scenarios and capture complete raw HTTP responses for debugging the persistent -1 error.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {lastRun && (
          <div className="text-sm text-gray-500">
            Last run: {lastRun.toLocaleString()}
          </div>
        )}

        {results && (
          <div className="space-y-6">
            {/* Summary */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Test Summary:</strong> {results.summary.successfulTests} successful, {results.summary.failedTests} failed, {results.summary.timeoutTests} timed out out of {results.summary.totalTests} total tests.
                {results.summary.failedTests > 0 && (
                  <div className="mt-2 text-sm">
                    Focus on failed tests below for debugging the GP51 API issues.
                  </div>
                )}
              </AlertDescription>
            </Alert>

            {/* Session Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Username:</span> {results.diagnosticInfo.sessionInfo.username}
                  </div>
                  <div>
                    <span className="font-medium">Token Length:</span> {results.diagnosticInfo.sessionInfo.tokenLength}
                  </div>
                  <div>
                    <span className="font-medium">Session Age:</span> {results.diagnosticInfo.sessionInfo.sessionAge} minutes
                  </div>
                  <div>
                    <span className="font-medium">API URL:</span> {results.diagnosticInfo.sessionInfo.apiUrl}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Results */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Detailed Test Results</h3>
              {results.testResults.map((result, index) => (
                <Collapsible key={index}>
                  <CollapsibleTrigger asChild>
                    <Card className="cursor-pointer hover:bg-gray-50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(result)}
                            <div>
                              <div className="font-medium">{result.testName}</div>
                              <div className="text-sm text-gray-600">
                                {result.method} • {result.duration}ms
                                {result.httpStatus && ` • HTTP ${result.httpStatus}`}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(result)}>
                              {result.timedOut ? 'TIMEOUT' : result.success ? 'SUCCESS' : 'FAILED'}
                            </Badge>
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <Card className="mt-2 border-l-4 border-l-blue-500">
                      <CardContent className="p-4 space-y-4">
                        {/* Request Details */}
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Request Details</h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium">URL:</span>
                              <div className="bg-gray-100 p-2 rounded font-mono text-xs break-all">
                                {result.url}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">Method:</span> {result.method}
                            </div>
                            <div>
                              <span className="font-medium">Request Headers:</span>
                              <div className="bg-gray-100 p-2 rounded font-mono text-xs">
                                <pre>{formatHeaders(result.requestHeaders)}</pre>
                              </div>
                            </div>
                            {result.requestBody && (
                              <div>
                                <span className="font-medium">Request Body:</span>
                                <div className="bg-gray-100 p-2 rounded font-mono text-xs">
                                  {result.requestBody}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Response Details */}
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Response Details</h4>
                          <div className="space-y-2 text-sm">
                            {result.httpStatus && (
                              <div>
                                <span className="font-medium">HTTP Status:</span> {result.httpStatus} {result.httpStatusText}
                              </div>
                            )}
                            {result.responseHeaders && (
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">Response Headers:</span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(formatHeaders(result.responseHeaders!))}
                                  >
                                    <Copy className="h-3 w-3 mr-1" />
                                    Copy
                                  </Button>
                                </div>
                                <div className="bg-gray-100 p-2 rounded font-mono text-xs max-h-40 overflow-y-auto">
                                  <pre>{formatHeaders(result.responseHeaders)}</pre>
                                </div>
                              </div>
                            )}
                            {result.responseBodyRaw && (
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">Raw Response Body ({result.responseBodyLength} chars):</span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(result.responseBodyRaw!)}
                                  >
                                    <Copy className="h-3 w-3 mr-1" />
                                    Copy
                                  </Button>
                                </div>
                                <div className="bg-gray-100 p-2 rounded font-mono text-xs max-h-60 overflow-y-auto">
                                  <pre>{result.responseBodyRaw}</pre>
                                </div>
                              </div>
                            )}
                            {result.responseBodyParsed && (
                              <div>
                                <span className="font-medium">Parsed JSON Response:</span>
                                <div className="bg-gray-100 p-2 rounded font-mono text-xs max-h-40 overflow-y-auto">
                                  <pre>{JSON.stringify(result.responseBodyParsed, null, 2)}</pre>
                                </div>
                              </div>
                            )}
                            {result.jsonParseError && (
                              <div>
                                <span className="font-medium text-red-600">JSON Parse Error:</span> {result.jsonParseError}
                              </div>
                            )}
                            {result.error && (
                              <div>
                                <span className="font-medium text-red-600">Error:</span> {result.error}
                                {result.errorType && ` (${result.errorType})`}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>
        )}

        {!results && !isRunning && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500 mb-4">No diagnostic tests have been run yet</div>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              Click "Run Comprehensive Diagnostics" to execute multiple GP51 API test scenarios and capture complete raw HTTP responses for debugging.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GP51RawDiagnosticPanel;
