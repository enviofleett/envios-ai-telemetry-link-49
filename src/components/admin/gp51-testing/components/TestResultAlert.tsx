
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import type { TestResultAlertProps } from '../types/connectionTesting';

const TestResultAlert: React.FC<TestResultAlertProps> = ({ result, testType }) => {
  if (!result) return null;

  return (
    <Alert variant={result.success ? "default" : "destructive"}>
      {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
      <AlertDescription>
        {result.success ? (
          <div className="text-green-700">
            <span>✅ {result.details || (testType === 'API_CONNECTION' ? 'Connection successful' : 'Live data fetched successfully')}</span>
            {testType === 'LIVE_DATA' && result.data && (
              <div className="text-sm mt-2 space-y-1">
                <div>Devices found: {result.data.total_devices}</div>
                <div>Positions retrieved: {result.data.total_positions}</div>
                <div>Last updated: {new Date(result.data.fetched_at).toLocaleString()}</div>
              </div>
            )}
          </div>
        ) : (
          <span>
            ❌ {result.error}
            {result.details && (
              <div className="text-sm mt-1 opacity-80">
                {result.details}
              </div>
            )}
          </span>
        )}
        {result.timestamp && <div className="text-xs text-muted-foreground mt-1">Tested at: {result.timestamp.toLocaleTimeString()}</div>}
      </AlertDescription>
    </Alert>
  );
};

export default TestResultAlert;
