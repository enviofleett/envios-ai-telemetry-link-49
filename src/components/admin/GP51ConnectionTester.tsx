
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity as ActivityIconLucide } from 'lucide-react';
import { useGP51AuthConsolidated } from '@/hooks/useGP51AuthConsolidated';

const GP51ConnectionTester: React.FC = () => {
  const { 
    isAuthenticated: isGp51Authenticated, 
    username: gp51Username, 
    tokenExpiresAt: gp51TokenExpiresAt,
    isCheckingStatus: authLoading 
  } = useGP51AuthConsolidated();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ActivityIconLucide className="h-5 w-5" />
          GP51 Connection Testing
        </CardTitle>
        <CardDescription>
          Test your GP51 integration and verify connectivity. 
          Session status is managed by the Authentication tab.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ActivityIconLucide className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-800">Connection Status</span>
          </div>
          <div className="text-sm text-blue-700">
            {authLoading ? (
              <span>Checking authentication status...</span>
            ) : isGp51Authenticated ? (
              <span>✅ Authenticated as: {gp51Username}</span>
            ) : (
              <span>❌ Not authenticated - Please configure GP51 credentials in the Authentication tab</span>
            )}
          </div>
        </div>

        <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md">
          <strong>Connection Guide:</strong>
          <ul className="mt-1 space-y-1 list-disc list-inside">
            <li>Ensure you are authenticated with GP51 via the 'Authentication' tab.</li>
            <li>GP51 credentials are securely stored and managed through the admin settings.</li>
            <li>Connection status is automatically monitored and updated.</li>
            <li>Contact support if you experience persistent connection issues.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default GP51ConnectionTester;
