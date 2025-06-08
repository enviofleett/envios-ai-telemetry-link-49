
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { gp51FallbackAuth, AuthenticationLevel } from '@/services/auth/GP51FallbackAuthService';

interface ConnectionStatusBannerProps {
  currentLevel: AuthenticationLevel;
  onRetryConnection?: () => void;
}

const ConnectionStatusBanner: React.FC<ConnectionStatusBannerProps> = ({
  currentLevel,
  onRetryConnection
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const handleRetryConnection = async () => {
    setIsChecking(true);
    try {
      const isHealthy = await gp51FallbackAuth.checkGP51Health();
      if (isHealthy && onRetryConnection) {
        onRetryConnection();
      }
    } catch (error) {
      console.error('Connection retry failed:', error);
    } finally {
      setIsChecking(false);
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    // Auto-check connection health every 30 seconds for degraded/offline modes
    if (currentLevel !== 'full') {
      const interval = setInterval(async () => {
        const isHealthy = await gp51FallbackAuth.checkGP51Health();
        if (isHealthy && onRetryConnection) {
          onRetryConnection();
        }
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [currentLevel, onRetryConnection]);

  const getBannerConfig = (level: AuthenticationLevel) => {
    switch (level) {
      case 'full':
        return {
          variant: 'default' as const,
          icon: <Wifi className="h-4 w-4" />,
          message: 'Connected to GP51 - All features available',
          showRetry: false,
          className: 'border-green-200 bg-green-50 text-green-800'
        };
      case 'degraded':
        return {
          variant: 'default' as const,
          icon: <Wifi className="h-4 w-4 text-yellow-500" />,
          message: 'Using cached GP51 data - Some features may be limited',
          showRetry: true,
          className: 'border-yellow-200 bg-yellow-50 text-yellow-800'
        };
      case 'minimal':
        return {
          variant: 'default' as const,
          icon: <WifiOff className="h-4 w-4 text-orange-500" />,
          message: 'GP51 unavailable - Local authentication active',
          showRetry: true,
          className: 'border-orange-200 bg-orange-50 text-orange-800'
        };
      case 'offline':
        return {
          variant: 'destructive' as const,
          icon: <AlertTriangle className="h-4 w-4" />,
          message: 'Offline mode - Viewing cached data only',
          showRetry: true,
          className: 'border-red-200 bg-red-50 text-red-800'
        };
    }
  };

  // Don't show banner for full connectivity
  if (currentLevel === 'full') {
    return null;
  }

  const config = getBannerConfig(currentLevel);

  return (
    <Alert className={`mb-4 ${config.className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {config.icon}
          <AlertDescription className="mb-0">
            {config.message}
          </AlertDescription>
        </div>
        
        {config.showRetry && (
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-75">
              Last check: {lastCheck.toLocaleTimeString()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetryConnection}
              disabled={isChecking}
              className="ml-2"
            >
              {isChecking ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Retry
            </Button>
          </div>
        )}
      </div>
    </Alert>
  );
};

export default ConnectionStatusBanner;
