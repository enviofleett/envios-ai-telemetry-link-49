
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGenericSMTPService } from '@/hooks/useGenericSMTPService';
import { Activity, AlertTriangle, CheckCircle, Clock, Mail, RefreshCw, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const SMTPMonitoringTab: React.FC = () => {
  const { smtpConfigs } = useGenericSMTPService();

  // Fetch email logs
  const { data: emailLogs, refetch: refetchEmailLogs } = useQuery({
    queryKey: ['email-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_notifications')
        .select(`
          *,
          smtp_configurations(name, host)
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'retry':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'retry':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateStats = () => {
    if (!emailLogs) return { total: 0, sent: 0, failed: 0, pending: 0 };
    
    return emailLogs.reduce((acc, log) => {
      acc.total++;
      if (log.status === 'sent') acc.sent++;
      else if (log.status === 'failed') acc.failed++;
      else if (log.status === 'pending' || log.status === 'retry') acc.pending++;
      return acc;
    }, { total: 0, sent: 0, failed: 0, pending: 0 });
  };

  const stats = calculateStats();
  const successRate = stats.total > 0 ? ((stats.sent / stats.total) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Emails</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Sent</p>
                <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium">Failed</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Success Rate</p>
                <p className="text-2xl font-bold">{successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Health Check */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            SMTP Configuration Health
          </CardTitle>
          <CardDescription>
            Monitor the health and status of your SMTP configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {smtpConfigs && smtpConfigs.length > 0 ? (
              smtpConfigs.map((config) => (
                <div key={config.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${config.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <div>
                      <p className="font-medium">{config.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {config.host}:{config.port} • {config.from_email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {config.encryption_type?.toUpperCase() || 'UNKNOWN'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={config.is_active ? 'default' : 'secondary'}>
                      {config.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No SMTP configurations found. Please add at least one SMTP configuration.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Email Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Email Activity Log</CardTitle>
              <CardDescription>
                Recent email sending activity and status
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => refetchEmailLogs()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {emailLogs && emailLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead>Configuration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emailLogs.slice(0, 20).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(log.status)}
                        <Badge variant="outline" className={getStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.recipient_email}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {log.subject}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{log.template_type}</Badge>
                    </TableCell>
                    <TableCell>
                      {log.sent_at ? new Date(log.sent_at).toLocaleString() : 'Not sent'}
                    </TableCell>
                    <TableCell>
                      {log.smtp_configurations?.name || 'Unknown'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                No email activity found. Send a test email to see logs here.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SMTPMonitoringTab;
