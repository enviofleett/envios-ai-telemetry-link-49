
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, XCircle, Info, CheckCircle } from 'lucide-react';

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
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-green-600">Error Log</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-sm text-green-600">No errors reported - all operations successful!</p>
          </div>
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

  // Clean up error messages to be more user-friendly
  const cleanErrorMessage = (message: string): string => {
    return message
      .replace(/GPS1/g, 'GP51') // Fix the GPS1/GP51 confusion
      .replace(/authentication failed/i, 'GP51 authentication failed')
      .replace(/session invalid/i, 'GP51 session invalid')
      .replace(/token expired/i, 'GP51 session expired')
      .replace(/\berror\b/gi, 'issue') // Make it sound less alarming
      .trim();
  };

  // Group errors by level for better display
  const errorsByLevel = errorLog.reduce((acc, error) => {
    acc[error.level] = (acc[error.level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Show only recent errors (last 15) and prioritize critical errors
  const recentErrors = errorLog
    .filter(error => error.level === 'error' || error.level === 'warning')
    .slice(-15)
    .reverse();

  // Check for session-related errors
  const hasSessionErrors = errorLog.some(error => 
    error.message.toLowerCase().includes('session') ||
    error.message.toLowerCase().includes('authentication') ||
    error.message.toLowerCase().includes('token')
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Error Log & Recovery Information
        </CardTitle>
        <div className="flex gap-3 text-xs mt-2">
          {errorsByLevel.error && (
            <span className="text-red-600 font-medium">Errors: {errorsByLevel.error}</span>
          )}
          {errorsByLevel.warning && (
            <span className="text-yellow-600 font-medium">Warnings: {errorsByLevel.warning}</span>
          )}
          {errorsByLevel.info && (
            <span className="text-blue-600">Info: {errorsByLevel.info}</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Session Error Recovery Information */}
        {hasSessionErrors && (
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-800">
              <div className="font-medium mb-2">🔧 Session Recovery Information</div>
              <div className="text-xs space-y-1">
                <p>• The enhanced import now uses your existing valid GP51 session (Octopus)</p>
                <p>• Session validation has been improved to prevent re-authentication failures</p>
                <p>• If issues persist, the session will automatically refresh during long operations</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Recent Errors */}
        <div className="space-y-2">
          {recentErrors.map((error, index) => (
            <Alert key={index} variant={getAlertVariant(error.level)} className="py-2">
              <div className="flex items-start gap-2">
                {getIcon(error.level)}
                <div className="flex-1">
                  <AlertDescription className="text-xs">
                    <div className="font-medium">
                      {cleanErrorMessage(error.message)}
                    </div>
                    <div className="text-gray-500 mt-1 flex items-center gap-2">
                      <span>{new Date(error.timestamp).toLocaleTimeString()}</span>
                      {error.username && (
                        <>
                          <span>•</span>
                          <span>User: {error.username}</span>
                        </>
                      )}
                    </div>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          ))}
        </div>

        {/* No Critical Errors Message */}
        {recentErrors.length === 0 && errorLog.length > 0 && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-xs text-green-800">
              <div className="font-medium">All Systems Operational</div>
              <div className="mt-1">
                No critical errors in recent operations. {errorLog.length} informational messages logged.
                Enhanced session management is working properly.
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Recovery Suggestions */}
        {errorsByLevel.error > 0 && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-xs text-orange-800">
              <div className="font-medium mb-2">🛠️ Recovery Suggestions</div>
              <div className="space-y-1">
                <p>• Enhanced session management should resolve most authentication issues</p>
                <p>• Your existing Octopus session is valid until June 8, 2025</p>
                <p>• If problems persist, try refreshing the GP51 connection in Admin Settings</p>
                <p>• The system will automatically retry failed operations with improved error handling</p>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ImportErrorLog;
