
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import GP51AuthenticationPanel from '@/components/admin/GP51AuthenticationPanel';
import { Shield, CheckCircle, AlertTriangle } from 'lucide-react';

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
    </div>
  );
};

export default GP51IntegrationTab;
