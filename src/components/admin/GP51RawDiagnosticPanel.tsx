
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useGP51Diagnostics } from '@/hooks/useGP51Diagnostics';
import { Activity, CheckCircle, XCircle, AlertTriangle, Loader2, Zap } from 'lucide-react';

const GP51RawDiagnosticPanel: React.FC = () => {
  const { isRunning, results, lastRun, runDiagnostics } = useGP51Diagnostics();

  const getStatusIcon = (result: any) => {
    if (result.gp51Success) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (result.success && result.gp51Status === -1) {
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    } else if (result.success) {
      return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (result: any) => {
    if (result.gp51Success) {
      return 'bg-green-100 text-green-800';
    } else if (result.success && result.gp51Status === -1) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (result.success) {
      return 'bg-orange-100 text-orange-800';
    } else {
      return 'bg-red-100 text-red-800';
    }
  };

  const getStatusText = (result: any) => {
    if (result.gp51Success) {
      return 'GP51 SUCCESS';
    } else if (result.success && result.gp51Status === -1) {
      return 'GP51 ERROR (-1)';
    } else if (result.success) {
      return `GP51 ERROR (${result.gp51Status})`;
    } else {
      return 'HTTP ERROR';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <CardTitle>GP51 Raw API Diagnostics</CardTitle>
          </div>
          <Button onClick={runDiagnostics} disabled={isRunning} size="sm">
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              'Run Raw Diagnostics'
            )}
          </Button>
        </div>
        <CardDescription>
          Test multiple request methods and tokens with the querydevicestree endpoint to identify the correct format.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {lastRun && (
          <div className="text-sm text-gray-500 mb-4">
            Last run: {lastRun.toLocaleString()}
          </div>
        )}

        {results && !isRunning && (
          <div className="space-y-4">
            {/* Summary */}
            <Alert className="border-blue-200 bg-blue-50">
              <Activity className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Test Summary:</strong> {results.summary.successfulTests}/{results.summary.totalTests} HTTP requests succeeded, 
                {results.summary.gp51SuccessfulTests} GP51 API calls successful
              </AlertDescription>
            </Alert>

            {/* Individual Test Results */}
            <div className="space-y-3">
              {results.testResults.map((result: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(result)}
                      <div>
                        <div className="font-medium">{result.testName}</div>
                        <div className="text-sm text-gray-600">{result.method} - {result.duration}ms</div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(result)}>
                      {getStatusText(result)}
                    </Badge>
                  </div>

                  {/* Response Details */}
                  {result.success && (
                    <div className="mt-3 space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">HTTP Status:</span> {result.httpStatus} {result.httpStatusText}
                      </div>
                      
                      {result.gp51Status !== undefined && (
                        <div className="text-sm">
                          <span className="font-medium">GP51 Status:</span> {result.gp51Status}
                          {result.gp51StatusMessage && (
                            <span className="text-gray-600"> - {result.gp51StatusMessage}</span>
                          )}
                        </div>
                      )}

                      {result.responseBodyParsed && result.gp51Success && (
                        <div className="text-sm">
                          <span className="font-medium">Data Found:</span>
                          {result.responseBodyParsed.groups && (
                            <span className="text-green-600"> {result.responseBodyParsed.groups.length} groups</span>
                          )}
                          {result.responseBodyParsed.devices && (
                            <span className="text-green-600"> {result.responseBodyParsed.devices.length} devices</span>
                          )}
                        </div>
                      )}

                      <details className="text-xs">
                        <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                          View Raw Response ({result.responseBodyLength} chars)
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                          {result.responseBodyRaw}
                        </pre>
                      </details>
                    </div>
                  )}

                  {/* Error Details */}
                  {!result.success && (
                    <div className="mt-3">
                      <div className="text-sm text-red-600">
                        <span className="font-medium">Error:</span> {result.error}
                      </div>
                      {result.timedOut && (
                        <div className="text-xs text-red-500">Request timed out after 30 seconds</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Recommendations */}
            {results.summary.gp51SuccessfulTests > 0 && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Success!</strong> Found working GP51 API configuration. 
                  The unified client will be updated to use the successful method.
                </AlertDescription>
              </Alert>
            )}

            {results.summary.gp51SuccessfulTests === 0 && results.summary.successfulTests > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>HTTP requests succeeded but GP51 API returned errors.</strong>
                  Check token validity and API endpoint configuration.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {!results && !isRunning && (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">No raw diagnostics have been run yet</div>
            <p className="text-sm text-gray-400">
              Click "Run Raw Diagnostics" to test multiple request methods and identify the correct GP51 API format
            </p>
          </div>
        )}

        {isRunning && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <div className="text-gray-500">Running comprehensive GP51 API tests...</div>
            <div className="text-xs text-gray-400 mt-2">Testing GET vs POST methods with different tokens</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GP51RawDiagnosticPanel;
