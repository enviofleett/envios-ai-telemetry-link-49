
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Clock, 
  AlertTriangle, 
  Users, 
  Activity,
  RefreshCw,
  Lock,
  Unlock
} from 'lucide-react';
import { useGPS51Integration } from '@/hooks/useGPS51Integration';

const GPS51SecurityDashboard: React.FC = () => {
  const { securityStats, refreshSecurityStats } = useGPS51Integration();

  useEffect(() => {
    // Refresh security stats on component mount
    refreshSecurityStats();
    
    // Set up periodic refresh every 30 seconds
    const interval = setInterval(refreshSecurityStats, 30000);
    
    return () => clearInterval(interval);
  }, [refreshSecurityStats]);

  const getSecurityLevel = () => {
    if (!securityStats) return { level: 'Unknown', color: 'text-gray-400', bgColor: 'bg-gray-900/20', borderColor: 'border-gray-700' };
    
    const { recentFailedAttempts, lockedAccounts, rateLimitExceeded } = securityStats;
    
    if (lockedAccounts > 0 || rateLimitExceeded > 5) {
      return { level: 'High Risk', color: 'text-red-400', bgColor: 'bg-red-900/20', borderColor: 'border-red-700' };
    } else if (recentFailedAttempts > 10 || rateLimitExceeded > 0) {
      return { level: 'Medium Risk', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20', borderColor: 'border-yellow-700' };
    } else {
      return { level: 'Low Risk', color: 'text-green-400', bgColor: 'bg-green-900/20', borderColor: 'border-green-700' };
    }
  };

  const securityLevel = getSecurityLevel();

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" />
            Security Dashboard
          </div>
          <Button
            onClick={refreshSecurityStats}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-300"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Security Level Alert */}
        <Alert className={`${securityLevel.bgColor} ${securityLevel.borderColor}`}>
          <Shield className={`h-4 w-4 ${securityLevel.color}`} />
          <AlertDescription className={securityLevel.color}>
            <strong>Security Level: {securityLevel.level}</strong>
            <div className="text-sm mt-1">
              {securityLevel.level === 'High Risk' && "Multiple security events detected. Review failed attempts and locked accounts."}
              {securityLevel.level === 'Medium Risk' && "Some security events detected. Monitor authentication attempts."}
              {securityLevel.level === 'Low Risk' && "Security status normal. No immediate threats detected."}
            </div>
          </AlertDescription>
        </Alert>

        {/* Security Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Failed Attempts (1h):</span>
              <Badge variant={securityStats?.recentFailedAttempts > 5 ? "destructive" : "default"}>
                {securityStats?.recentFailedAttempts || 0}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Rate Limit Exceeded:</span>
              <Badge variant={securityStats?.rateLimitExceeded > 0 ? "destructive" : "default"}>
                {securityStats?.rateLimitExceeded || 0}
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Locked Accounts:</span>
              <div className="flex items-center gap-1">
                {securityStats?.lockedAccounts > 0 ? (
                  <Lock className="h-3 w-3 text-red-400" />
                ) : (
                  <Unlock className="h-3 w-3 text-green-400" />
                )}
                <Badge variant={securityStats?.lockedAccounts > 0 ? "destructive" : "default"}>
                  {securityStats?.lockedAccounts || 0}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Total Events:</span>
              <Badge variant="outline" className="border-gray-600 text-gray-300">
                {securityStats?.totalEvents || 0}
              </Badge>
            </div>
          </div>
        </div>

        {/* Rate Limiting Configuration */}
        <div className="space-y-3">
          <h4 className="font-medium text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-400" />
            Rate Limiting
          </h4>
          <div className="p-3 bg-gray-700 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Max Attempts:</span>
              <span className="text-white">5 per 15 minutes</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Lockout Duration:</span>
              <span className="text-white">15 minutes</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Reset Window:</span>
              <span className="text-white">15 minutes</span>
            </div>
          </div>
        </div>

        {/* Security Features */}
        <div className="space-y-3">
          <h4 className="font-medium text-white flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-400" />
            Active Security Features
          </h4>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center justify-between p-2 bg-gray-700 rounded">
              <span className="text-sm text-gray-300">Input Validation</span>
              <Badge variant="default" className="bg-green-600">
                <Shield className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-700 rounded">
              <span className="text-sm text-gray-300">Rate Limiting</span>
              <Badge variant="default" className="bg-green-600">
                <Clock className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-700 rounded">
              <span className="text-sm text-gray-300">Account Lockout</span>
              <Badge variant="default" className="bg-green-600">
                <Lock className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-700 rounded">
              <span className="text-sm text-gray-300">Secure Hashing</span>
              <Badge variant="default" className="bg-green-600">
                <Shield className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
          </div>
        </div>

        {/* Last Activity */}
        {securityStats?.lastEventTime && (
          <div className="pt-3 border-t border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Last Security Event:</span>
              <span className="text-gray-300">
                {new Date(securityStats.lastEventTime).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Security Recommendations */}
        <Alert className="bg-blue-900/20 border-blue-700">
          <AlertTriangle className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-400">
            <strong>Security Best Practices:</strong>
            <ul className="text-xs mt-1 space-y-1">
              <li>• Monitor failed authentication attempts regularly</li>
              <li>• Review locked accounts and investigate suspicious activity</li>
              <li>• Use strong, unique passwords for GPS51 accounts</li>
              <li>• Enable additional security measures if available</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default GPS51SecurityDashboard;
