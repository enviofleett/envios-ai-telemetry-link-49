
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { packageAnalyticsService } from '@/services/analytics/packageAnalyticsService';

const FeatureUsageMatrix: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['featureUsage'],
    queryFn: packageAnalyticsService.getFeatureUsageMatrix,
  });

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Loading feature usage...</div>;
  if (error) return <div className="text-red-600">Failed to load feature usage.</div>;
  if (!data?.length) return <div className="text-muted-foreground">No feature usage data found.</div>;

  return (
    <div>
      <div className="font-medium mb-2">Feature Usage Matrix</div>
      <div className="overflow-auto">
        <table className="min-w-[320px] table-auto border rounded">
          <thead>
            <tr>
              <th className="text-left px-4 py-2">Feature</th>
              <th className="text-right px-4 py-2">Users</th>
            </tr>
          </thead>
          <tbody>
            {data.map((feature) => (
              <tr key={feature.feature_name}>
                <td className="px-4 py-2">{feature.feature_name}</td>
                <td className="px-4 py-2 text-right">{feature.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default FeatureUsageMatrix;
