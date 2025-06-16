
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';

const EmailTriggersTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Email Triggers
        </CardTitle>
        <CardDescription>
          Configure automated email triggers and workflows
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <p>Email trigger configuration will be available in the next phase of development.</p>
          <p className="text-sm mt-2">Features coming soon: Event-based triggers, workflow automation, conditions</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailTriggersTab;
