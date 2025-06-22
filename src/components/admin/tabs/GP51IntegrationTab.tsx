
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import GP51AuthenticationPanel from '@/components/admin/GP51AuthenticationPanel';
import GP51EndpointTester from '@/components/admin/GP51EndpointTester';
import { Shield, CheckCircle, AlertTriangle, TestTube } from 'lucide-react';

const GP51IntegrationTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle>GP51 Platform Integration</CardTitle>
          </div>
          <CardDescription>
            Configure and manage your GPS51 platform connection for vehicle tracking and fleet management.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GP51AuthenticationPanel />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <TestTube className="h-5 w-5 text-orange-600" />
            <CardTitle>Endpoint Migration Testing</CardTitle>
          </div>
          <CardDescription>
            Test the new GP51 API endpoint to ensure proper connectivity and authentication after migration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GP51EndpointTester />
        </CardContent>
      </Card>
    </div>
  );
};

export default GP51IntegrationTab;
