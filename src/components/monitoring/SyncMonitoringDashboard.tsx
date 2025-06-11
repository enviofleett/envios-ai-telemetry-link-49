
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const SyncMonitoringDashboard: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sync Monitoring</CardTitle>
        <CardDescription>
          Real-time synchronization status and metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Sync monitoring is currently unavailable while the system is being rebuilt.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default SyncMonitoringDashboard;
