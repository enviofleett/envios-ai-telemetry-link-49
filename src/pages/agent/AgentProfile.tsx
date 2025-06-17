
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AgentProfile: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Agent Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Agent profile management will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentProfile;
