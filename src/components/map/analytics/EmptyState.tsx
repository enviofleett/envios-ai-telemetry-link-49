
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const EmptyState: React.FC = () => {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <p className="text-gray-500">No analytics data available</p>
      </CardContent>
    </Card>
  );
};

export default EmptyState;
