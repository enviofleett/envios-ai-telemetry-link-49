
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, XCircle, Info } from 'lucide-react';

interface ErrorLogEntry {
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  username?: string;
}

interface ImportErrorLogProps {
  errorLog: ErrorLogEntry[];
}

const ImportErrorLog: React.FC<ImportErrorLogProps> = ({ errorLog }) => {
  if (!errorLog || errorLog.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-green-600">Error Log</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-600">No errors reported - all operations successful!</p>
        </CardContent>
      </Card>
    );
  }

  const getIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getAlertVariant = (level: string) => {
    switch (level) {
      case 'error':
        return 'destructive' as const;
      case 'warning':
        return 'default' as const;
      default:
        return 'default' as const;
    }
  };

  // Group errors by level
  const errorsByLevel = errorLog.reduce((acc, error) => {
    acc[error.level] = (acc[error.level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Show only recent errors (last 10) and critical errors
  const recentErrors = errorLog
    .filter(error => error.level === 'error' || error.level === 'warning')
    .slice(-10)
    .reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Error Log</CardTitle>
        <div className="flex gap-2 text-xs">
          {errorsByLevel.error && (
            <span className="text-red-600">Errors: {errorsByLevel.error}</span>
          )}
          {errorsByLevel.warning && (
            <span className="text-yellow-600">Warnings: {errorsByLevel.warning}</span>
          )}
          {errorsByLevel.info && (
            <span className="text-blue-600">Info: {errorsByLevel.info}</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {recentErrors.map((error, index) => (
          <Alert key={index} variant={getAlertVariant(error.level)} className="py-2">
            <div className="flex items-start gap-2">
              {getIcon(error.level)}
              <div className="flex-1">
                <AlertDescription className="text-xs">
                  <div className="font-medium">
                    {error.message.replace(/GPS1/g, 'GP51')}
                  </div>
                  <div className="text-gray-500 mt-1">
                    {error.timestamp} {error.username && `(${error.username})`}
                  </div>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        ))}

        {recentErrors.length === 0 && errorLog.length > 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              No critical errors in recent operations. {errorLog.length} info messages logged.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ImportErrorLog;
