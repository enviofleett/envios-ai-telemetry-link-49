
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Mail, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EmailQueueItem {
  id: string;
  recipient_email: string;
  subject: string;
  status: string;
  created_at: string;
  sent_at?: string;
  error_message?: string;
  retry_count: number;
}

const EmailQueueTab: React.FC = () => {
  const { toast } = useToast();
  const [queueItems, setQueueItems] = useState<EmailQueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    sent: 0,
    failed: 0,
  });

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_notification_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setQueueItems(data || []);

      // Calculate stats
      const total = data?.length || 0;
      const pending = data?.filter(item => item.status === 'pending').length || 0;
      const sent = data?.filter(item => item.status === 'sent').length || 0;
      const failed = data?.filter(item => item.status === 'failed').length || 0;

      setStats({ total, pending, sent, failed });
    } catch (error: any) {
      toast({
        title: "Load Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Sent</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Queue
          </CardTitle>
          <CardDescription>
            Monitor email delivery status and queue performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
                <p className="text-sm text-muted-foreground">Sent</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
            </div>
            <Button 
              onClick={loadQueue} 
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Email Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {queueItems.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No email activity found</p>
            ) : (
              queueItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{item.subject}</p>
                      {getStatusBadge(item.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">To: {item.recipient_email}</p>
                    <p className="text-sm text-muted-foreground">
                      Created: {formatDate(item.created_at)}
                      {item.sent_at && ` • Sent: ${formatDate(item.sent_at)}`}
                    </p>
                    {item.error_message && (
                      <p className="text-sm text-red-600 mt-1">Error: {item.error_message}</p>
                    )}
                    {item.retry_count > 0 && (
                      <p className="text-sm text-muted-foreground">Retries: {item.retry_count}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailQueueTab;
