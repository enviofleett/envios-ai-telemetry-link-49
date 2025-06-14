
import React from "react";
import { useMerchantFeeOverrides } from "@/hooks/useMerchantFeeOverrides";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const MerchantFeeOverridesCard: React.FC = () => {
  const { data, isLoading } = useMerchantFeeOverrides();

  return (
    <Card className="max-w-xl mx-auto mt-6">
      <CardHeader>
        <CardTitle>Merchant Fee Overrides</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">Merchant</th>
                <th className="text-right">Country</th>
                <th className="text-right">Custom Commission</th>
                <th className="text-right">Custom Registration Fee</th>
                <th className="text-right">Billing Cycle</th>
              </tr>
            </thead>
            <tbody>
              {data && data.map((row) => (
                <tr key={row.id}>
                  <td className="py-1">{row.merchant_id}</td>
                  <td className="py-1 text-right">{row.country_code || "-"}</td>
                  <td className="py-1 text-right">{row.commission_rate_override ?? "-"}</td>
                  <td className="py-1 text-right">{row.registration_fee_override ?? "-"}</td>
                  <td className="py-1 text-right">{row.billing_cycle}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
};
export default MerchantFeeOverridesCard;
