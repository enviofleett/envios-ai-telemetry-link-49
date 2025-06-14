
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TestResult } from '@/services/gp51/gp51ValidationTypes';
import { CheckCircle, XCircle } from 'lucide-react';

function getTestIcon(test: TestResult) {
  if (test.success) {
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  }
  return <XCircle className="h-4 w-4 text-red-600" />;
}

function getCategoryStatus(tests: TestResult[]) {
  if (tests.length === 0) return 'pending';
  const passed = tests.filter(t => t.success).length;
  if (passed === tests.length) return 'success';
  if (passed === 0) return 'error';
  return 'warning';
}

function getCategoryBadgeVariant(status: string) {
  switch (status) {
    case 'success': return 'default';
    case 'error': return 'destructive';
    case 'warning': return 'secondary';
    default: return 'outline';
  }
}

interface ValidationCategoryCardProps {
  label: string;
  tests: TestResult[];
}

export function ValidationCategoryCard({ label, tests }: ValidationCategoryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{label}</span>
          <Badge variant={getCategoryBadgeVariant(getCategoryStatus(tests))}>
            {tests.filter(t => t.success).length}/{tests.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {tests.map((test, index) => (
          <div key={index} className="flex items-center justify-between p-2 border rounded">
            <div className="flex items-center gap-2">
              {getTestIcon(test)}
              <span className="text-sm">{test.testName}</span>
            </div>
            <span className="text-xs text-muted-foreground">{test.duration}ms</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
