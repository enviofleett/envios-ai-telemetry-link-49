
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { packageAnalyticsService } from '@/services/analytics/packageAnalyticsService';

const ReferralCodePerformance: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['referralCodePerformance'],
    queryFn: packageAnalyticsService.getReferralCodePerformance,
  });

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Loading referral code stats...</div>;
  if (error) return <div className="text-red-600">Failed to load referral code data.</div>;
  if (!data?.length) return <div className="text-muted-foreground">No referral code data.</div>;

  return (
    <div>
      <div className="font-medium mb-2">Referral Code Usage</div>
      <div className="overflow-auto">
        <table className="min-w-[320px] table-auto border rounded">
          <thead>
            <tr>
              <th className="text-left px-4 py-2">Code</th>
              <th className="text-right px-4 py-2">Redemptions</th>
              <th className="text-right px-4 py-2">Discount (%)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((ref: any) => (
              <tr key={ref.code}>
                <td className="px-4 py-2">{ref.code}</td>
                <td className="px-4 py-2 text-right">{ref.usage_count}</td>
                <td className="px-4 py-2 text-right">{ref.discount_percentage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default ReferralCodePerformance;
