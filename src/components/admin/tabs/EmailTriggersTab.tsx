
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';

const EmailTriggersTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Email Triggers</h2>
        <p className="text-muted-foreground">
          Configure automated email triggers for various system events.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Email Automation
          </CardTitle>
          <CardDescription>
            Set up automated email triggers for user actions and system events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Email triggers configuration will be available in the next phase of development.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailTriggersTab;
