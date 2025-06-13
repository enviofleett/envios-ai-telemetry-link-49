
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react';

export const AnalyticsTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Email Analytics</CardTitle>
        <CardDescription>
          Track email performance and engagement metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Email analytics will be available here
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
