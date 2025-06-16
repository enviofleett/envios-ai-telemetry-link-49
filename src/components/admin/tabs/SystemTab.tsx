
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

const SystemTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">System Settings</h2>
        <p className="text-muted-foreground">
          Configure global system preferences and operational parameters.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Configuration
          </CardTitle>
          <CardDescription>
            Manage system-wide settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            System configuration will be available in the next phase of development.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemTab;
