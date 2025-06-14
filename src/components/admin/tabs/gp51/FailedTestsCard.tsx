
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { XCircle } from 'lucide-react';
import { TestResult } from '@/services/gp51/gp51ValidationTypes';

interface FailedTestsCardProps {
  failedTests: TestResult[];
}

export function FailedTestsCard({ failedTests }: FailedTestsCardProps) {
  if (failedTests.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-red-600">Failed Tests</CardTitle>
        <CardDescription>
          Tests that failed and require attention
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {failedTests.map((test, index) => (
          <div key={index} className="p-3 border border-red-200 rounded bg-red-50">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="font-medium text-red-900">{test.testName}</span>
            </div>
            <p className="text-sm text-red-700">{test.error}</p>
            <p className="text-xs text-red-600 mt-1">Duration: {test.duration}ms</p>
            {Array.isArray(test.suggestedFixes) && test.suggestedFixes.length > 0 && (
              <div className="mt-2">
                <span className="block font-semibold text-red-900 mb-1">How to fix:</span>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {test.suggestedFixes.map((fix, idx) => (
                    <li key={idx} className="text-red-800">{fix}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
