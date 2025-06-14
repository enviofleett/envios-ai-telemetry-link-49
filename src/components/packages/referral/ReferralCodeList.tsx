
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { referralApi } from '@/services/referralApi';
import type { ReferralAgentWithUserDetails } from '@/types/referral';
import ReferralCodeCard from './ReferralCodeCard';

interface ReferralCodeListProps {
  agents: ReferralAgentWithUserDetails[] | undefined;
}

const ReferralCodeList: React.FC<ReferralCodeListProps> = ({ agents }) => {
  const { data: referralCodes, isLoading: isLoadingCodes } = useQuery({
    queryKey: ['referral-codes'],
    queryFn: referralApi.getReferralCodes,
  });

  const agentsById = React.useMemo(() => {
    if (!agents) return new Map();
    return new Map(agents.map(agent => [agent.id, agent]));
  }, [agents]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Existing Referral Codes</h3>
      
      {isLoadingCodes ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {referralCodes?.map((code) => (
            <ReferralCodeCard
              key={code.id}
              code={code}
              agentName={agentsById.get(code.agent_id)?.name}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReferralCodeList;
