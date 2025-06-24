
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

const WorkshopActivationPanelWrapper: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Workshop Activation
        </CardTitle>
        <CardDescription>
          Workshop activation functionality is currently being developed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <div className="text-muted-foreground">
            Workshop activation features will be available once the database schema is updated.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkshopActivationPanelWrapper;
