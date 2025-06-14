
import React from 'react';
import { CheckCircle, XCircle, UserCircle, Clock, RefreshCw } from 'lucide-react';
import type { GP51AuthStatusForDisplay } from '../types/connectionTesting';

const GP51SessionStatusDisplay: React.FC<GP51AuthStatusForDisplay> = ({
  isLoading,
  isAuthenticated,
  username,
  tokenExpiresAt,
}) => {
  return (
    <div className="p-4 border rounded-md bg-muted/40">
      <h4 className="font-medium mb-2 text-lg">Current GP51 Session Status</h4>
      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" /> Checking session status...
        </div>
      ) : isAuthenticated ? (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="font-medium">Authenticated</span>
          </div>
          {username && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserCircle className="h-4 w-4" /> User: {username}
            </div>
          )}
          {tokenExpiresAt && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" /> Session expires: {new Date(tokenExpiresAt).toLocaleString()}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-500" />
          <span className="font-medium">Not Authenticated</span>
          <span className="text-sm text-muted-foreground">Please login via the Authentication tab.</span>
        </div>
      )}
    </div>
  );
};

export default GP51SessionStatusDisplay;
