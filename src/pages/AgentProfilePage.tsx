
import React from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { referralApi } from '@/services/referralApi';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface UserInfoForm {
  full_name: string;
}

interface BankDetailsForm {
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  routing_number: string;
}

const AgentProfilePage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: agentProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['myAgentProfile'],
    queryFn: referralApi.getMyAgentProfile,
    enabled: !!user,
  });

  const {
    register: registerUserInfo,
    handleSubmit: handleUserInfoSubmit,
    reset: resetUserInfo,
    formState: { isDirty: isUserInfoDirty },
  } = useForm<UserInfoForm>();

  const {
    register: registerBankDetails,
    handleSubmit: handleBankDetailsSubmit,
    reset: resetBankDetails,
    formState: { isDirty: isBankDetailsDirty },
  } = useForm<BankDetailsForm>();
  
  React.useEffect(() => {
    if (user?.user_metadata?.full_name) {
      resetUserInfo({ full_name: user.user_metadata.full_name });
    }
  }, [user, resetUserInfo]);

  React.useEffect(() => {
    if (agentProfile?.bank_account_details) {
      resetBankDetails(agentProfile.bank_account_details);
    }
  }, [agentProfile, resetBankDetails]);

  const updateUserInfoMutation = useMutation({
    mutationFn: async (data: UserInfoForm) => {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: data.full_name },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Your information has been updated.');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update information: ${error.message}`);
    },
  });

  const updateBankDetailsMutation = useMutation({
    mutationFn: (data: BankDetailsForm) =>
      referralApi.updateMyAgentProfile({ bank_account_details: data }),
    onSuccess: (data) => {
      toast.success('Bank details updated successfully!');
      queryClient.setQueryData(['myAgentProfile'], data);
      if (data.bank_account_details) {
        resetBankDetails(data.bank_account_details);
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to update bank details: ${error.message}`);
    },
  });

  const onUserInfoSubmit = (data: UserInfoForm) => {
    updateUserInfoMutation.mutate(data);
  };
  
  const onBankDetailsSubmit = (data: BankDetailsForm) => {
    updateBankDetailsMutation.mutate(data);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Agent Profile</h1>
        <Card>
          <CardHeader>
            <CardTitle>Your Information</CardTitle>
            <CardDescription>Manage your personal and contact information.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUserInfoSubmit(onUserInfoSubmit)} className="space-y-4 max-w-lg">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" {...registerUserInfo('full_name')} defaultValue={user?.user_metadata?.full_name || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue={user?.email || ''} readOnly className="bg-gray-100" />
              </div>
              <Button type="submit" disabled={updateUserInfoMutation.isPending || !isUserInfoDirty}>
                {updateUserInfoMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bank Account Details</CardTitle>
            <CardDescription>This information is required for commission payouts. It will be securely stored.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingProfile ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading bank details...</span>
              </div>
            ) : (
              <form onSubmit={handleBankDetailsSubmit(onBankDetailsSubmit)} className="space-y-4 max-w-lg">
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input id="bank_name" {...registerBankDetails('bank_name')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_holder_name">Account Holder Name</Label>
                  <Input id="account_holder_name" {...registerBankDetails('account_holder_name')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_number">Account Number</Label>
                  <Input id="account_number" {...registerBankDetails('account_number')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="routing_number">Routing Number</Label>
                  <Input id="routing_number" {...registerBankDetails('routing_number')} />
                </div>
                <Button type="submit" disabled={updateBankDetailsMutation.isPending || !isBankDetailsDirty}>
                  {updateBankDetailsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Bank Details
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AgentProfilePage;
