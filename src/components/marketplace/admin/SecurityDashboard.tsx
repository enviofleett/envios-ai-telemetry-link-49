
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, Eye, RefreshCw } from 'lucide-react';
import { securityAuditService, type AuditLog } from '@/services/marketplace/SecurityAuditService';

const SecurityDashboard: React.FC = () => {
  const [securityLogs, setSecurityLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState({
    severity: '',
    eventType: '',
    limit: 50
  });

  useEffect(() => {
    loadSecurityLogs();
  }, [filter]);

  const loadSecurityLogs = async () => {
    setIsLoading(true);
    try {
      const logs = await securityAuditService.getSecurityLogs({
        severity: filter.severity || undefined,
        eventType: filter.eventType || undefined,
        limit: filter.limit
      });
      setSecurityLogs(logs);
    } catch (error) {
      console.error('Failed to load security logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'payment_attempt':
      case 'failed_payment':
        return '💳';
      case 'fraud_detection':
        return '🚨';
      case 'suspicious_activity':
        return '⚠️';
      case 'account_access':
        return '🔐';
      default:
        return '📝';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Security Dashboard
        </h2>
        <Button onClick={loadSecurityLogs} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Severity</label>
              <select
                value={filter.severity}
                onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Event Type</label>
              <select
                value={filter.eventType}
                onChange={(e) => setFilter({ ...filter, eventType: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="">All Events</option>
                <option value="payment_attempt">Payment Attempts</option>
                <option value="failed_payment">Failed Payments</option>
                <option value="fraud_detection">Fraud Detection</option>
                <option value="suspicious_activity">Suspicious Activity</option>
                <option value="account_access">Account Access</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Limit</label>
              <select
                value={filter.limit}
                onChange={(e) => setFilter({ ...filter, limit: parseInt(e.target.value) })}
                className="w-full p-2 border rounded-md"
              >
                <option value={25}>25 entries</option>
                <option value={50}>50 entries</option>
                <option value={100}>100 entries</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Recent Security Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading security logs...</div>
          ) : securityLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No security events found</div>
          ) : (
            <div className="space-y-4">
              {securityLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl">{getEventTypeIcon(log.event_type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getSeverityColor(log.severity)}>
                            {log.severity.toUpperCase()}
                          </Badge>
                          <span className="text-sm text-gray-500">{log.event_type}</span>
                        </div>
                        <p className="text-sm font-medium mb-2">{log.description}</p>
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>Time: {new Date(log.created_at).toLocaleString()}</div>
                          {log.user_id && <div>User ID: {log.user_id}</div>}
                          {log.ip_address && <div>IP: {log.ip_address}</div>}
                        </div>
                        {log.additional_data && Object.keys(log.additional_data).length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-blue-600 cursor-pointer">
                              View Additional Data
                            </summary>
                            <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                              {JSON.stringify(log.additional_data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityDashboard;
