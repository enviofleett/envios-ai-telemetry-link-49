
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import { telemetryApi } from '@/services/telemetryApi';

interface GP51ConnectionStatusProps {
  showRefresh?: boolean;
  className?: string;
}

const GP51ConnectionStatus: React.FC<GP51ConnectionStatusProps> = ({ 
  showRefresh = false, 
  className = '' 
}) => {
  const [status, setStatus] = useState<'unknown' | 'connected' | 'failed'>('unknown');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkConnection = async () => {
    setIsRefreshing(true);
    
    try {
      const result = await telemetryApi.testConnection();
      setStatus(result.success ? 'connected' : 'failed');
      setLastChecked(new Date());
    } catch (error) {
      setStatus('failed');
      setLastChecked(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const getStatusBadge = () => {
    switch (status) {
      case 'connected':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            GP51 Connected
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <WifiOff className="h-3 w-3 mr-1" />
            GP51 Offline
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <AlertCircle className="h-3 w-3 mr-1" />
            GP51 Unknown
          </Badge>
        );
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {getStatusBadge()}
      
      {showRefresh && (
        <Button
          variant="ghost"
          size="sm"
          onClick={checkConnection}
          disabled={isRefreshing}
          className="h-6 px-2"
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      )}
      
      {lastChecked && (
        <span className="text-xs text-muted-foreground">
          Last checked: {lastChecked.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

export default GP51ConnectionStatus;
