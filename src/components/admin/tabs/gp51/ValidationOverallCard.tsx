
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ValidationSuite } from '@/services/gp51/gp51ValidationTypes';

export function ValidationOverallCard({ overall }: { overall: ValidationSuite['overall'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Overall Results</span>
          <Badge variant={overall.successRate >= 80 ? "default" : "destructive"}>
            {overall.successRate}% Success Rate
          </Badge>
        </CardTitle>
        <CardDescription>
          {overall.passedTests} of {overall.totalTests} tests passed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Test Progress</span>
            <span>{overall.passedTests}/{overall.totalTests}</span>
          </div>
          <Progress value={overall.successRate} className="w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
