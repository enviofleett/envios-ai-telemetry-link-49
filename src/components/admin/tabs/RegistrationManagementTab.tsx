
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Clock, User, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { PendingRegistration } from '@/types/registration';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const RegistrationManagementTab: React.FC = () => {
  const [registrations, setRegistrations] = useState<PendingRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<PendingRegistration | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const { toast } = useToast();

  useEffect(() => {
    loadRegistrations();
  }, []);

  const loadRegistrations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-registration-manager', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) throw error;
      
      setRegistrations(data.registrations || []);
    } catch (error) {
      console.error('Error loading registrations:', error);
      toast({
        title: "Error",
        description: "Failed to load pending registrations",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = (registration: PendingRegistration, actionType: 'approve' | 'reject') => {
    setSelectedRegistration(registration);
    setAction(actionType);
    setAdminNotes('');
    setShowDialog(true);
  };

  const processRegistration = async () => {
    if (!selectedRegistration) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-registration-manager', {
        body: {
          registration_id: selectedRegistration.id,
          action,
          admin_notes: adminNotes
        },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: data.message,
      });

      setShowDialog(false);
      loadRegistrations(); // Reload the list

    } catch (error: any) {
      console.error('Processing error:', error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} registration`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Registration Management</CardTitle>
          <CardDescription>Manage pending user registration requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Registration Management
          </CardTitle>
          <CardDescription>
            Review and approve pending user registration requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {registrations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No pending registrations</p>
            </div>
          ) : (
            <div className="space-y-4">
              {registrations.map((registration) => (
                <Card key={registration.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{registration.name}</h3>
                          {getStatusBadge(registration.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{registration.email}</p>
                        {registration.phone_number && (
                          <p className="text-sm text-muted-foreground">{registration.phone_number}</p>
                        )}
                        {registration.company_name && (
                          <p className="text-sm text-muted-foreground">Company: {registration.company_name}</p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Package className="h-4 w-4" />
                          <span className="text-sm font-medium">{registration.packages.name}</span>
                          <Badge variant="outline">${registration.packages.price}/{registration.packages.billing_cycle}</Badge>
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          Submitted: {new Date(registration.submitted_at).toLocaleString()}
                        </p>
                      </div>
                      
                      {registration.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAction(registration, 'approve')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleAction(registration, 'reject')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'approve' ? 'Approve' : 'Reject'} Registration
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {action} the registration for {selectedRegistration?.name}?
              {action === 'approve' && ' This will create a new user account.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
              <Textarea
                id="admin-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={`Add notes about this ${action} decision...`}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={processRegistration}
              disabled={isProcessing}
              variant={action === 'approve' ? 'default' : 'destructive'}
            >
              {isProcessing ? 'Processing...' : `${action === 'approve' ? 'Approve' : 'Reject'} Registration`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RegistrationManagementTab;
