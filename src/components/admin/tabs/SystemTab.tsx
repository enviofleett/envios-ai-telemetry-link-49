
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

const SystemTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          System Settings
        </CardTitle>
        <CardDescription>
          Configure core system settings and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <p>System configuration will be available in the next phase of development.</p>
          <p className="text-sm mt-2">Features coming soon: Performance settings, logging levels, maintenance mode</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemTab;
