
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export const BulkOperationsTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Bulk Email Operations</CardTitle>
        <CardDescription>
          Send emails to multiple recipients or import contact lists
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Bulk email operations will be available here
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
