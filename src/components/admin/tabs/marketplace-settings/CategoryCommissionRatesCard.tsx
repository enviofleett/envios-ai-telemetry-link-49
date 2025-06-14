
import React from "react";
import { useCategoryCommissionRates } from "@/hooks/useCategoryCommissionRates";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const CategoryCommissionRatesCard: React.FC = () => {
  const { data, isLoading } = useCategoryCommissionRates();

  return (
    <Card className="max-w-xl mx-auto mt-6">
      <CardHeader>
        <CardTitle>Category Commission Rates</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">Category</th>
                <th className="text-right">Country</th>
                <th className="text-right">Rate (%)</th>
                <th className="text-right">Currency</th>
              </tr>
            </thead>
            <tbody>
              {data && data.map((row) => (
                <tr key={row.id}>
                  <td className="py-1">{row.category_id}</td>
                  <td className="py-1 text-right">{row.country_code}</td>
                  <td className="py-1 text-right">{row.commission_rate}</td>
                  <td className="py-1 text-right">{row.currency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
};
export default CategoryCommissionRatesCard;
