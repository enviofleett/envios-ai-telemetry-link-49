
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PublicRegistrationService } from '@/services/publicRegistrationService';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  RefreshCw,
  AlertCircle 
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';

interface PendingRegistration {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  city: string;
  created_at: string;
  status: string;
  otp_verifications?: {
    verified_at: string;
    expires_at: string;
    attempts_count: number;
    max_attempts: number;
  };
}

const PendingRegistrationsManager: React.FC = () => {
  const { toast } = useToast();
  const [registrations, setRegistrations] = useState<PendingRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadPendingRegistrations = async () => {
    setLoading(true);
    try {
      const result = await PublicRegistrationService.getPendingRegistrations();
      
      if (result.success) {
        setRegistrations(result.registrations || []);
      } else {
        toast({
          title: "Failed to Load Registrations",
          description: result.error || "Unknown error occurred",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading registrations:', error);
      toast({
        title: "Error Loading Registrations",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingRegistrations();
  }, []);

  const handleApprove = async (registrationId: string) => {
    setProcessing(registrationId);
    
    try {
      // Get current user ID (this would normally come from auth context)
      const currentUserId = 'admin-user-id'; // TODO: Get from auth context
      
      const result = await PublicRegistrationService.approveRegistration(
        registrationId, 
        currentUserId,
        {
          createGP51User: true,
          generateGP51Username: true,
          temporaryPassword: 'TempPass123!'
        }
      );

      if (result.success) {
        toast({
          title: "Registration Approved",
          description: `User created successfully${result.gp51Username ? ` with GP51 username: ${result.gp51Username}` : ''}`,
        });
        
        // Remove from pending list
        setRegistrations(prev => prev.filter(reg => reg.id !== registrationId));
      } else {
        toast({
          title: "Approval Failed",
          description: result.error || "Failed to approve registration",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Approval error:', error);
      toast({
        title: "Approval Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (registrationId: string) => {
    setProcessing(registrationId);
    
    try {
      const currentUserId = 'admin-user-id'; // TODO: Get from auth context
      
      const result = await PublicRegistrationService.rejectRegistration(
        registrationId,
        currentUserId,
        rejectReason
      );

      if (result.success) {
        toast({
          title: "Registration Rejected",
          description: "Registration has been rejected",
        });
        
        // Remove from pending list
        setRegistrations(prev => prev.filter(reg => reg.id !== registrationId));
        setRejectReason('');
      } else {
        toast({
          title: "Rejection Failed",
          description: result.error || "Failed to reject registration",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Rejection error:', error);
      toast({
        title: "Rejection Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Loading Pending Registrations...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending User Registrations
          </CardTitle>
          <CardDescription>
            Review and approve user registrations that have completed phone verification
          </CardDescription>
          <div className="flex justify-between items-center">
            <Badge variant="outline">
              {registrations.length} pending approval{registrations.length !== 1 ? 's' : ''}
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadPendingRegistrations}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {registrations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pending registrations found</p>
              <p className="text-sm">All registrations have been processed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {registrations.map((registration) => (
                <Card key={registration.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{registration.name}</span>
                          <Badge variant="secondary">OTP Verified</Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {registration.email}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {registration.phone_number}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {registration.city}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Registered: {formatDate(registration.created_at)}
                          </div>
                        </div>

                        {registration.otp_verifications && (
                          <div className="text-xs text-muted-foreground">
                            Phone verified: {formatDate(registration.otp_verifications.verified_at)}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(registration.id)}
                          disabled={processing === registration.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {processing === registration.id ? 'Processing...' : 'Approve'}
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={processing === registration.id}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Reject Registration</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to reject the registration for {registration.name}?
                                Please provide a reason for rejection.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="py-4">
                              <Textarea
                                placeholder="Reason for rejection (optional)"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                              />
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleReject(registration.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Reject Registration
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingRegistrationsManager;
