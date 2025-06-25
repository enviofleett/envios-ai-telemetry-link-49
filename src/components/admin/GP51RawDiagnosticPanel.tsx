
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useGP51Diagnostics } from '@/hooks/useGP51Diagnostics';
import { Activity, CheckCircle, XCircle, AlertTriangle, Loader2, Copy, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

const GP51RawDiagnosticPanel: React.FC = () => {
  const { isRunning, results, lastRun, runDiagnostics } = useGP51Diagnostics();
  const [showRawData, setShowRawData] = useState(false);
  const [copiedTest, setCopiedTest] = useState<string | null>(null);

  const handleCopyResponse = async (testName: string, responseData: string) => {
    try {
      await navigator.clipboard.writeText(responseData);
      setCopiedTest(testName);
      setTimeout(() => setCopiedTest(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const getStatusIcon = (success: boolean, timedOut?: boolean) => {
    if (timedOut) {
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
    return success ? 
      <CheckCircle className="h-4 w-4 text-green-600" /> : 
      <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusColor = (success: boolean, timedOut?: boolean) => {
    if (timedOut) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return success ? 
      'bg-green-100 text-green-800' : 
      'bg-red-100 text-red-800';
  };

  const formatHeaders = (headers: Record<string, string>) => {
    return Object.entries(headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  };

  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <CardTitle>GP51 Raw API Diagnostics</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRawData(!showRawData)}
            >
              {showRawData ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
              {showRawData ? 'Hide Raw Data' : 'Show Raw Data'}
            </Button>
            <Button 
              onClick={runDiagnostics} 
              disabled={isRunning} 
              size="sm"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                'Run Raw Diagnostics'
              )}
            </Button>
          </div>
        </div>
        <CardDescription>
          Comprehensive GP51 API testing with full HTTP response capture for debugging
        </CardDescription>
      </CardHeader>
      <CardContent>
        {lastRun && (
          <div className="text-sm text-gray-500 mb-4">
            Last run: {lastRun.toLocaleString()}
          </div>
        )}

        {/* Summary Section */}
        {results && (
          <div className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{results.summary.totalTests}</div>
                <div className="text-sm text-blue-700">Total Tests</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{results.summary.successfulTests}</div>
                <div className="text-sm text-green-700">Successful</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{results.summary.failedTests}</div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{results.summary.timeoutTests}</div>
                <div className="text-sm text-yellow-700">Timeouts</div>
              </div>
            </div>

            <Alert className={`border-2 ${
              results.summary.failedTests > 0 ? 'border-red-200 bg-red-50' : 
              results.summary.timeoutTests > 0 ? 'border-yellow-200 bg-yellow-50' : 
              'border-green-200 bg-green-50'
            }`}>
              <AlertDescription className={
                results.summary.failedTests > 0 ? 'text-red-800' : 
                results.summary.timeoutTests > 0 ? 'text-yellow-800' : 
                'text-green-800'
              }>
                <strong>Overall Status:</strong> {results.message}
                <div className="mt-2 text-sm">
                  Session: {results.diagnosticInfo.sessionInfo.username} | 
                  Token Length: {results.diagnosticInfo.sessionInfo.tokenLength} | 
                  Expires: {new Date(results.diagnosticInfo.sessionInfo.tokenExpiry).toLocaleString()}
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Test Results */}
        {results && results.testResults ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Results</h3>
            {results.testResults.map((result, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(result.success, result.timedOut)}
                    <div>
                      <div className="font-medium">{result.testName}</div>
                      <div className="text-sm text-gray-600">
                        {result.method} → {result.url}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(result.success, result.timedOut)}>
                      {result.timedOut ? 'TIMEOUT' : result.success ? 'SUCCESS' : 'FAILED'}
                    </Badge>
                    {result.duration && (
                      <Badge variant="outline">
                        {result.duration}ms
                      </Badge>
                    )}
                    {result.httpStatus && (
                      <Badge variant="outline">
                        HTTP {result.httpStatus}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Error Information */}
                {result.error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Error:</strong> {result.error}
                      {result.errorType && (
                        <div className="text-sm mt-1">Type: {result.errorType}</div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Raw Response Data */}
                {showRawData && (
                  <div className="space-y-3">
                    {/* Request Headers */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">Request Headers</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyResponse(`${result.testName}-req-headers`, formatHeaders(result.requestHeaders))}
                        >
                          <Copy className="h-3 w-3" />
                          {copiedTest === `${result.testName}-req-headers` ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        {formatHeaders(result.requestHeaders)}
                      </pre>
                    </div>

                    {/* Request Body */}
                    {result.requestBody && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">Request Body</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyResponse(`${result.testName}-req-body`, result.requestBody!)}
                          >
                            <Copy className="h-3 w-3" />
                            {copiedTest === `${result.testName}-req-body` ? 'Copied!' : 'Copy'}
                          </Button>
                        </div>
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {result.requestBody}
                        </pre>
                      </div>
                    )}

                    {/* Response Headers */}
                    {result.responseHeaders && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">Response Headers</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyResponse(`${result.testName}-res-headers`, formatHeaders(result.responseHeaders!))}
                          >
                            <Copy className="h-3 w-3" />
                            {copiedTest === `${result.testName}-res-headers` ? 'Copied!' : 'Copy'}
                          </Button>
                        </div>
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {formatHeaders(result.responseHeaders)}
                        </pre>
                      </div>
                    )}

                    {/* Raw Response Body */}
                    {result.responseBodyRaw && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">
                            Raw Response Body 
                            {result.responseBodyLength && (
                              <span className="text-gray-500">({result.responseBodyLength} bytes)</span>
                            )}
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyResponse(`${result.testName}-res-body`, result.responseBodyRaw!)}
                          >
                            <Copy className="h-3 w-3" />
                            {copiedTest === `${result.testName}-res-body` ? 'Copied!' : 'Copy'}
                          </Button>
                        </div>
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto max-h-64">
                          {showRawData ? result.responseBodyRaw : truncateText(result.responseBodyRaw)}
                        </pre>
                      </div>
                    )}

                    {/* Parsed Response */}
                    {result.responseBodyParsed && result.isJsonResponse && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">Parsed JSON Response</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyResponse(`${result.testName}-parsed`, JSON.stringify(result.responseBodyParsed, null, 2))}
                          >
                            <Copy className="h-3 w-3" />
                            {copiedTest === `${result.testName}-parsed` ? 'Copied!' : 'Copy'}
                          </Button>
                        </div>
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto max-h-64">
                          {JSON.stringify(result.responseBodyParsed, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* JSON Parse Error */}
                    {result.jsonParseError && (
                      <Alert variant="destructive">
                        <AlertDescription>
                          <strong>JSON Parse Error:</strong> {result.jsonParseError}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : !isRunning ? (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">No diagnostics have been run yet</div>
            <p className="text-sm text-gray-400">
              Click "Run Raw Diagnostics" to perform comprehensive GP51 API testing with full response capture
            </p>
          </div>
        ) : (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <div className="text-gray-500">Running comprehensive diagnostics...</div>
            <div className="text-sm text-gray-400 mt-2">
              This may take a few moments as we capture full HTTP responses
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GP51RawDiagnosticPanel;
