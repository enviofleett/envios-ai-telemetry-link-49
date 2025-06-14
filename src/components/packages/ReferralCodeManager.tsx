import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { referralApi } from '@/services/referral';
import CreateReferralCodeForm from './referral/CreateReferralCodeForm';
import ReferralCodeList from './referral/ReferralCodeList';

const ReferralCodeManager: React.FC = () => {
  const { data: referralAgents, isLoading: isLoadingAgents } = useQuery({
    queryKey: ['referral-agents'],
    queryFn: referralApi.getReferralAgents,
  });

  return (
    <div className="space-y-6">
      <CreateReferralCodeForm agents={referralAgents} isLoadingAgents={isLoadingAgents} />
      <ReferralCodeList agents={referralAgents} />
    </div>
  );
};

export default ReferralCodeManager;
