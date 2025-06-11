
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, CheckCircle, AlertTriangle, XCircle, Zap, Activity } from 'lucide-react';

const GP51DiagnosticsPanel: React.FC = () => {
  const isRunning = false;
  const results: any[] = [];
  const lastRun = null;
  
  const runDiagnostics = () => {
    console.log('GP51 diagnostics not available - service is being rebuilt');
  };
  
  const runFullSync = () => {
    console.log('GP51 sync not available - service is being rebuilt');
  };
  
  const getSyncStatus = () => ({
    activeLocks: []
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'fail': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pass': return 'default';
      case 'warning': return 'secondary';
      case 'fail': return 'destructive';
      default: return 'outline';
    }
  };

  const syncStatus = getSyncStatus();
  const hasActiveLocks = syncStatus.activeLocks && syncStatus.activeLocks.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            GP51 System Diagnostics
          </CardTitle>
          <CardDescription>
            GP51 integration service is being rebuilt - diagnostics temporarily unavailable
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Control Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={runDiagnostics} 
              disabled={true}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Diagnostics Unavailable
            </Button>
            <Button 
              onClick={runFullSync} 
              variant="outline"
              disabled={true}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Sync Unavailable
            </Button>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              GP51 diagnostics and sync features are temporarily unavailable while the integration service is being rebuilt.
              Please check back later or contact support if you need immediate assistance.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default GP51DiagnosticsPanel;
