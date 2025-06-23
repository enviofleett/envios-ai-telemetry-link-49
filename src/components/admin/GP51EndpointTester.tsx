
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TestTube, Play, CheckCircle, XCircle, Clock } from 'lucide-react';
import { gp51EndpointTester } from '@/utils/gp51-endpoint-tester';
import { toast } from 'sonner';

const GP51EndpointTester: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);

  const runConnectivityTest = async () => {
    setIsTesting(true);
    try {
      const results = await gp51EndpointTester.testConnectivity();
      setTestResults(results);
      toast.success('Connectivity test completed');
    } catch (error) {
      toast.error('Test failed: ' + (error as Error).message);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Endpoint Testing</h3>
          <p className="text-sm text-gray-600">Test GP51 API endpoint connectivity</p>
        </div>
        <Button onClick={runConnectivityTest} disabled={isTesting}>
          {isTesting ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run Test
            </>
          )}
        </Button>
      </div>

      {testResults.length > 0 && (
        <div className="space-y-3">
          {testResults.map((result, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{result.endpoint}</CardTitle>
                  <Badge className={result.isReachable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {result.isReachable ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {result.isReachable ? 'Reachable' : 'Failed'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xs space-y-1">
                  <div>Method: {result.method}</div>
                  {result.responseStatus && <div>Status: {result.responseStatus}</div>}
                  {result.error && <div className="text-red-600">Error: {result.error}</div>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GP51EndpointTester;
