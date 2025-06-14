import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { referralApi } from '@/services/referral';
import ReferralAgentList from './ReferralAgentList';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const ReferralAgentManager: React.FC = () => {
  const { data: referralAgents, isLoading: isLoadingAgents, isError } = useQuery({
    queryKey: ['referral-agents'],
    queryFn: referralApi.getReferralAgents,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Applications</CardTitle>
        <CardDescription>Review and manage agent statuses.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingAgents && <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}
        {isError && <div className="text-red-500 text-center p-8">Error loading agents.</div>}
        {referralAgents && <ReferralAgentList agents={referralAgents} />}
      </CardContent>
    </Card>
  );
};

export default ReferralAgentManager;
