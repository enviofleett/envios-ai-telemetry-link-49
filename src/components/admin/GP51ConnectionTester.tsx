
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity as ActivityIconLucide } from 'lucide-react';
import { useGP51AuthConsolidated } from '@/hooks/useGP51AuthConsolidated';

import GP51SessionStatusDisplay from './gp51-testing/components/GP51SessionStatusDisplay';
import GP51ApiConnectionTest from './gp51-testing/components/GP51ApiConnectionTest';
import GP51LiveDataFetchTest from './gp51-testing/components/GP51LiveDataFetchTest';
import type { ConnectionTestResult } from './gp51-testing/types/connectionTesting';

const GP51ConnectionTester: React.FC = () => {
  const { 
    isAuthenticated: isGp51Authenticated, 
    username: gp51Username, 
    tokenExpiresAt: gp51TokenExpiresAt,
    isCheckingStatus: authLoading 
  } = useGP51AuthConsolidated();

  const [apiTestResult, setApiTestResult] = useState<ConnectionTestResult | null>(null);

  const handleApiTestResult = (result: ConnectionTestResult) => {
    setApiTestResult(result);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ActivityIconLucide className="h-5 w-5" />
          GP51 Connection Testing
        </CardTitle>
        <CardDescription>
          Test your GP51 integration and verify live data connectivity. 
          Session status is managed by the Authentication tab.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <GP51SessionStatusDisplay
          isLoading={authLoading}
          isAuthenticated={isGp51Authenticated}
          username={gp51Username}
          tokenExpiresAt={gp51TokenExpiresAt?.toISOString()}
        />

        <GP51ApiConnectionTest
          isGp51Authenticated={isGp51Authenticated}
          authLoading={authLoading}
          onTestResult={handleApiTestResult}
        />

        <GP51LiveDataFetchTest
          isGp51Authenticated={isGp51Authenticated}
          authLoading={authLoading}
          isApiTestSuccessful={apiTestResult?.success}
        />

        <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md">
          <strong>Testing Guide:</strong>
          <ul className="mt-1 space-y-1 list-disc list-inside">
            <li>Ensure you are authenticated with GP51 via the 'Authentication' tab.</li>
            <li>First, use the 'API Connection Test' to verify credentials and basic API reachability.</li>
            <li>If successful, use 'Fetch Live Data' to test pulling actual data from GP51.</li>
            <li>Both tests should pass for complete GP51 functionality.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default GP51ConnectionTester;
