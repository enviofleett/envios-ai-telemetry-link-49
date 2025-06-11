
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

interface HealthCheck {
  passed: number;
  failed: number;
  total: number;
  details: any[];
}

const SystemHealthDashboard: React.FC = () => {
  const [healthChecks, setHealthChecks] = useState<HealthCheck>({
    passed: 0,
    failed: 0,
    total: 0,
    details: []
  });
  const [isRunning, setIsRunning] = useState(false);

  const runHealthChecks = async () => {
    setIsRunning(true);
    
    // Simulate health checks
    setTimeout(() => {
      setHealthChecks({
        passed: 3,
        failed: 1,
        total: 4,
        details: [
          { name: 'Database Connection', status: 'passed', message: 'Connected' },
          { name: 'GP51 Service', status: 'failed', message: 'Service unavailable' },
          { name: 'Authentication', status: 'passed', message: 'Working' },
          { name: 'File Storage', status: 'passed', message: 'Available' }
        ]
      });
      setIsRunning(false);
    }, 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">System Health Dashboard</h2>
        <Button onClick={runHealthChecks} disabled={isRunning}>
          {isRunning ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Running Checks...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Run Health Checks
            </>
          )}
        </Button>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          System health monitoring is currently unavailable while services are being rebuilt.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Passed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{healthChecks.passed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{healthChecks.failed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{healthChecks.total}</div>
          </CardContent>
        </Card>
      </div>

      {healthChecks.details.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Health Check Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthChecks.details.map((check, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(check.status)}
                    <span className="font-medium">{check.name}</span>
                  </div>
                  <div className="text-sm text-gray-600">{check.message}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SystemHealthDashboard;
