
import React, { useState, useEffect, ReactNode } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NetworkErrorBoundaryProps {
  children: ReactNode;
}

const NetworkErrorBoundary: React.FC<NetworkErrorBoundaryProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRetry(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRetry(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      setShowRetry(false);
      window.location.reload();
    }
  };

  if (!isOnline || showRetry) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md">
          <Alert className="border-orange-200 bg-orange-50">
            <WifiOff className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="space-y-3">
                <p className="font-medium">Connection Lost</p>
                <p className="text-sm">
                  Please check your internet connection and try again.
                </p>
                <Button 
                  onClick={handleRetry}
                  size="sm"
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Connection
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      {isOnline && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-green-100 text-green-800 px-3 py-2 rounded-md shadow-lg border border-green-200 flex items-center gap-2 text-sm">
            <Wifi className="h-4 w-4" />
            Connected
          </div>
        </div>
      )}
    </>
  );
};

export default NetworkErrorBoundary;
