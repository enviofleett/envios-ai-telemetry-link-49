
import React from "react";
import { useCountryMarketplaceSettings } from "@/hooks/useCountryMarketplaceSettings";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const CountryMarketplaceSettingsCard: React.FC = () => {
  const { data, isLoading } = useCountryMarketplaceSettings();

  return (
    <Card className="max-w-xl mx-auto mt-6">
      <CardHeader>
        <CardTitle>Country Marketplace Settings</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">Country</th>
                <th className="text-right">Currency</th>
                <th className="text-right">Commission Rate</th>
                <th className="text-right">Registration Fee</th>
                <th className="text-right">Billing Cycles</th>
              </tr>
            </thead>
            <tbody>
              {data && data.map((row) => (
                <tr key={row.id}>
                  <td className="py-1">{row.country_code}</td>
                  <td className="py-1 text-right">{row.currency}</td>
                  <td className="py-1 text-right">{row.default_commission_rate}</td>
                  <td className="py-1 text-right">{row.default_registration_fee}</td>
                  <td className="py-1 text-right">{row.billing_cycles?.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
};
export default CountryMarketplaceSettingsCard;
