import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Inbox, Clock, CheckCircle, XCircle, RefreshCw, Pause, Play } from 'lucide-react';

const EmailQueueTab: React.FC = () => {
  const [queueStatus, setQueueStatus] = useState('running');

  const queueStats = {
    pending: 45,
    sent: 1250,
    failed: 12,
    total: 1307
  };

  const queueItems = [
    {
      id: '1',
      recipient: 'user@example.com',
      template: 'Welcome Email',
      status: 'pending',
      scheduledFor: '2024-01-15 14:30',
      attempts: 0
    },
    {
      id: '2',
      recipient: 'admin@workshop.com',
      template: 'Maintenance Reminder',
      status: 'sent',
      scheduledFor: '2024-01-15 14:25',
      attempts: 1,
      sentAt: '2024-01-15 14:25'
    },
    {
      id: '3',
      recipient: 'fleet@company.com',
      template: 'Invoice Notification',
      status: 'failed',
      scheduledFor: '2024-01-15 14:20',
      attempts: 3,
      error: 'Invalid email address'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">{status}</Badge>;
      case 'sent':
        return <Badge variant="default">{status}</Badge>;
      case 'failed':
        return <Badge variant="destructive">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Inbox className="h-5 w-5" />
            Email Queue Management
          </CardTitle>
          <CardDescription>
            Monitor and manage the email delivery queue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${queueStatus === 'running' ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm font-medium">
                  Queue Status: {queueStatus === 'running' ? 'Running' : 'Paused'}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQueueStatus(queueStatus === 'running' ? 'paused' : 'running')}
              >
                {queueStatus === 'running' ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause Queue
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Queue
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Queue Statistics */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{queueStats.pending}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{queueStats.sent}</div>
                <div className="text-sm text-muted-foreground">Sent</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{queueStats.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{queueStats.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </CardContent>
            </Card>
          </div>

          {/* Queue Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Queue Progress</span>
              <span>{Math.round(((queueStats.sent + queueStats.failed) / queueStats.total) * 100)}%</span>
            </div>
            <Progress value={((queueStats.sent + queueStats.failed) / queueStats.total) * 100} />
          </div>

          {/* Queue Items */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Recent Queue Items</h3>
            {queueItems.map((item) => (
              <Card key={item.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(item.status)}
                      <div>
                        <div className="font-medium">{item.recipient}</div>
                        <div className="text-sm text-muted-foreground">{item.template}</div>
                        <div className="text-xs text-muted-foreground">
                          Scheduled: {item.scheduledFor}
                          {item.sentAt && ` | Sent: ${item.sentAt}`}
                          {item.error && ` | Error: ${item.error}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        Attempts: {item.attempts}
                      </span>
                      {getStatusBadge(item.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailQueueTab;
