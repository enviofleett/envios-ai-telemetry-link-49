
import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cog } from 'lucide-react';

const DeviceConfiguration: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Device Configuration</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cog className="h-5 w-5" />
              GPS Device Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Configure GP51 devices, update firmware, and manage device-specific settings.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default DeviceConfiguration;
