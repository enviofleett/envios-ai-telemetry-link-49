
import React from 'react';
import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import LoadingSpinner from '@/components/LoadingSpinner';

interface DataLoadingWrapperProps {
  loading: boolean;
  error: string | null;
  healthStatus?: 'healthy' | 'unhealthy' | 'checking';
  onRefresh?: () => void;
  children: React.ReactNode;
  fallbackMessage?: string;
}

const DataLoadingWrapper: React.FC<DataLoadingWrapperProps> = ({
  loading,
  error,
  healthStatus = 'healthy',
  onRefresh,
  children,
  fallbackMessage = "No data available"
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-2 text-sm text-muted-foreground">Loading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Data Loading Error</AlertTitle>
        <AlertDescription className="mt-2">
          {error}
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="mt-2 ml-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="relative">
      {/* Health status indicator */}
      {healthStatus !== 'healthy' && (
        <div className="absolute top-0 right-0 z-10">
          <div className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
            {healthStatus === 'checking' ? (
              <Wifi className="h-3 w-3 animate-pulse" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            {healthStatus === 'checking' ? 'Checking...' : 'Connection Issue'}
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
};

export default DataLoadingWrapper;
