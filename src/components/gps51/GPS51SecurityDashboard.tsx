
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Clock, Activity, RefreshCw } from 'lucide-react';
import { GPS51SecurityService } from '@/services/gp51/GPS51SecurityService';

const GPS51SecurityDashboard: React.FC = () => {
  const [securityStats, setSecurityStats] = useState<any>(null);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);

  const refreshData = () => {
    const stats = GPS51SecurityService.getSecurityStats();
    const events = GPS51SecurityService.getSecurityEvents(50);
    
    setSecurityStats(stats);
    setSecurityEvents(events);
  };

  useEffect(() => {
    refreshData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatEventType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getEventBadgeVariant = (type: string) => {
    switch (type) {
      case 'login_attempt': return 'default';
      case 'login_failed': return 'destructive';
      case 'account_locked': return 'destructive';
      case 'rate_limit_exceeded': return 'destructive';
      default: return 'secondary';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login_attempt': return '✅';
      case 'login_failed': return '❌';
      case 'account_locked': return '🔒';
      case 'rate_limit_exceeded': return '⚡';
      default: return '📋';
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Failed Attempts</p>
                <p className="text-2xl font-bold text-white">
                  {securityStats?.recentFailedAttempts || 0}
                </p>
                <p className="text-xs text-gray-500">Last hour</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Rate Limited</p>
                <p className="text-2xl font-bold text-white">
                  {securityStats?.rateLimitExceeded || 0}
                </p>
                <p className="text-xs text-gray-500">Last hour</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Locked Accounts</p>
                <p className="text-2xl font-bold text-white">
                  {securityStats?.lockedAccounts || 0}
                </p>
                <p className="text-xs text-gray-500">Currently</p>
              </div>
              <Shield className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Events</p>
                <p className="text-2xl font-bold text-white">
                  {securityStats?.totalEvents || 0}
                </p>
                <p className="text-xs text-gray-500">All time</p>
              </div>
              <Activity className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Events Log */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-400" />
              Security Events Log
            </CardTitle>
            <Button
              onClick={refreshData}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {securityEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No security events recorded yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {securityEvents.map((event, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getEventIcon(event.type)}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">
                          {formatEventType(event.type)}
                        </span>
                        <Badge variant={getEventBadgeVariant(event.type)} className="text-xs">
                          {event.identifier}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-400">
                        {event.timestamp.toLocaleString()}
                      </div>
                      {event.details && (
                        <div className="text-xs text-gray-500 mt-1">
                          {typeof event.details === 'object' 
                            ? JSON.stringify(event.details)
                            : String(event.details)
                          }
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Configuration */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Security Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-white">Rate Limiting</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Attempts:</span>
                  <span className="text-white">5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Time Window:</span>
                  <span className="text-white">15 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Account Lockout:</span>
                  <span className="text-green-400">Enabled</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-white">Password Security</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Hash Algorithm:</span>
                  <span className="text-white">MD5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Input Validation:</span>
                  <span className="text-green-400">Enabled</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">SQL Injection Protection:</span>
                  <span className="text-green-400">Enabled</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GPS51SecurityDashboard;
