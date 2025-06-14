
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { referralApi } from '@/services/referralApi';
import AgentReferralCodeList from './AgentReferralCodeList';
import CreateAgentReferralCodeForm from './CreateAgentReferralCodeForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const AgentReferralCodeManager: React.FC = () => {
  const { data: agentProfile, isLoading: isLoadingProfile, isError: isErrorProfile } = useQuery({
    queryKey: ['my-agent-profile'],
    queryFn: referralApi.getMyAgentProfile,
  });

  if (isLoadingProfile) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isErrorProfile || !agentProfile) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Could not load your agent profile. You might not be set up as a referral agent yet. Please try again later or contact support.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <CreateAgentReferralCodeForm agentId={agentProfile.id} />
      <AgentReferralCodeList />
    </div>
  );
};

export default AgentReferralCodeManager;
