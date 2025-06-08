
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Check, X, Clock, User } from 'lucide-react';

interface AdminRoleRequest {
  id: string;
  user_id: string;
  requested_role: string;
  status: 'pending' | 'approved' | 'rejected';
  request_reason: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  user_name: string;
  user_email: string;
}

const AdminRoleRequestsManager: React.FC = () => {
  const [requests, setRequests] = useState<AdminRoleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_role_requests')
        .select(`
          *,
          envio_users!inner(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedRequests = (data || []).map(request => ({
        ...request,
        user_name: request.envio_users.name,
        user_email: request.envio_users.email
      }));

      setRequests(formattedRequests);
    } catch (error) {
      console.error('Failed to load admin role requests:', error);
      toast({
        title: "Error",
        description: "Failed to load admin role requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleRequest = async (requestId: string, action: 'approve' | 'reject') => {
    setProcessing(requestId);
    
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      // Update the request status
      const { error: updateError } = await supabase
        .from('admin_role_requests')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // If approved, update the user's role
      if (action === 'approve') {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: 'admin' })
          .eq('user_id', request.user_id);

        if (roleError) throw roleError;

        // Update user registration status
        const { error: userError } = await supabase
          .from('envio_users')
          .update({ registration_status: 'approved' })
          .eq('id', request.user_id);

        if (userError) throw userError;
      }

      toast({
        title: action === 'approve' ? "Request Approved" : "Request Rejected",
        description: `Admin role request has been ${action === 'approve' ? 'approved' : 'rejected'}`,
      });

      // Reload requests
      await loadRequests();
    } catch (error) {
      console.error(`Failed to ${action} request:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} the request`,
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600"><Check className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Admin Role Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading requests...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Admin Role Requests
        </CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              No admin role requests found.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span className="font-medium">{request.user_name}</span>
                      <span className="text-sm text-gray-500">({request.user_email})</span>
                    </div>
                    <p className="text-sm text-gray-600">{request.request_reason}</p>
                    <p className="text-xs text-gray-400">
                      Requested: {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(request.status)}
                  </div>
                </div>
                
                {request.status === 'pending' && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => handleRequest(request.id, 'approve')}
                      disabled={processing === request.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRequest(request.id, 'reject')}
                      disabled={processing === request.id}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminRoleRequestsManager;
