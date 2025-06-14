import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { referralApi } from '@/services/referral';
import ReferralCodeCard from '../ReferralCodeCard';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const AgentReferralCodeList: React.FC = () => {
  const { data: referralCodes, isLoading, isError, error } = useQuery({
    queryKey: ['referral-codes'], // Same key as admin, RLS filters it
    queryFn: referralApi.getReferralCodes,
  });

  if (isLoading) {
    return (
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
    );
  }

  if (isError) {
    return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
                Could not load your referral codes. {(error as Error)?.message}
            </AlertDescription>
        </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Your Existing Codes</h3>
      {referralCodes && referralCodes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {referralCodes?.map((code) => (
            <ReferralCodeCard
              key={code.id}
              code={code}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">You haven't created any referral codes yet.</p>
      )}
    </div>
  );
};

export default AgentReferralCodeList;
