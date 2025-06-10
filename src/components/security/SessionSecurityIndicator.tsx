
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { enhancedGP51SessionManager } from '@/services/security/enhancedGP51SessionManager';

export const SessionSecurityIndicator: React.FC = () => {
  const [sessionHealth, setSessionHealth] = useState<{
    isHealthy: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    lastValidated: Date | null;
    issues: string[];
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkSessionHealth = async () => {
    setIsChecking(true);
    try {
      const health = await enhancedGP51SessionManager.getSessionHealth();
      setSessionHealth(health);
    } catch (error) {
      console.error('Failed to check session health:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkSessionHealth();
    
    // Check session health every 5 minutes
    const interval = setInterval(checkSessionHealth, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getRiskLevelColor = (riskLevel: 'low' | 'medium' | 'high') => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
    }
  };

  const getRiskIcon = (riskLevel: 'low' | 'medium' | 'high') => {
    switch (riskLevel) {
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (!sessionHealth) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Session Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Checking session security...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Session Security
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={checkSessionHealth}
            disabled={isChecking}
          >
            {isChecking ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Session Status</span>
          <Badge className={sessionHealth.isHealthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
            {sessionHealth.isHealthy ? (
              <CheckCircle className="h-3 w-3 mr-1" />
            ) : (
              <AlertTriangle className="h-3 w-3 mr-1" />
            )}
            {sessionHealth.isHealthy ? 'Secure' : 'At Risk'}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Risk Level</span>
          <Badge className={getRiskLevelColor(sessionHealth.riskLevel)}>
            {getRiskIcon(sessionHealth.riskLevel)}
            <span className="ml-1 capitalize">{sessionHealth.riskLevel}</span>
          </Badge>
        </div>

        {sessionHealth.lastValidated && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Last Validated</span>
            <span className="text-sm text-muted-foreground">
              {sessionHealth.lastValidated.toLocaleTimeString()}
            </span>
          </div>
        )}

        {sessionHealth.issues.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium text-red-600">Security Issues</span>
            <ul className="space-y-1">
              {sessionHealth.issues.map((issue, index) => (
                <li key={index} className="text-sm text-red-600 flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3" />
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!sessionHealth.isHealthy && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              Session security issues detected. Please refresh your connection.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => enhancedGP51SessionManager.invalidateSession()}
              className="w-full"
            >
              <Shield className="h-4 w-4 mr-2" />
              Refresh Session
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
