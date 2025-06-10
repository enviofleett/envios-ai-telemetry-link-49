
import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database } from 'lucide-react';

const SystemImport: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">System Import</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Import & Migration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Import vehicle data, migrate from other systems, and manage bulk data operations.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SystemImport;
